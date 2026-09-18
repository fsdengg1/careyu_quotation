const fs = require("fs");
const path = require("path");
const prisma = require("../models/prisma");
const { renderQuotationHtml } = require("../pdf/template");
const { buildPdfFilename } = require("../utils/pdfFilename");
const { httpError } = require("../middleware/validate");
const quotationService = require("./quotationService");

function getPdfDir() {
  try {
    return path.join(__dirname, "../../storage/pdfs");
  } catch {
    return "";
  }
}

function getWorkerEnv() {
  return globalThis.__WORKER_ENV || null;
}

function resolveChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function toBuffer(bytes) {
  if (!bytes) return Buffer.alloc(0);
  if (Buffer.isBuffer(bytes)) return bytes;
  return Buffer.from(bytes);
}

async function renderPdfBytes(html, workerEnv) {
  if (workerEnv) {
    if (!workerEnv.BROWSER) {
      throw httpError(500, "Cloudflare Browser Rendering is not bound on this Worker.");
    }
    const puppeteer = require("@cloudflare/puppeteer");
    const browser = await puppeteer.launch(workerEnv.BROWSER);
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load", timeout: 120000 });
      try {
        return toBuffer(
          await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
          })
        );
      } catch {
        const stream = await page.createPDFStream({
          format: "A4",
          printBackground: true,
          preferCSSPageSize: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      }
    } finally {
      await browser.close();
    }
  }

  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromePath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 120000 });
    return toBuffer(
      await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );
  } finally {
    await browser.close();
  }
}

async function storePdf(id, pdfBuffer, workerEnv) {
  if (workerEnv?.PDF_BUCKET) {
    const key = `pdfs/${id}.pdf`;
    await workerEnv.PDF_BUCKET.put(key, pdfBuffer, {
      httpMetadata: { contentType: "application/pdf" },
    });
    return `r2:${key}`;
  }
  if (!workerEnv) {
    const pdfDir = getPdfDir();
    fs.mkdirSync(pdfDir, { recursive: true });
    const outputPath = path.join(pdfDir, `${id}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);
    return outputPath;
  }
  return "generated";
}

async function readStoredPdf(quotation, workerEnv) {
  if (quotation.pdfPath && quotation.pdfPath.startsWith("r2:") && workerEnv?.PDF_BUCKET) {
    const object = await workerEnv.PDF_BUCKET.get(quotation.pdfPath.slice(3));
    if (object) return toBuffer(await object.arrayBuffer());
  }
  if (
    quotation.pdfPath &&
    quotation.pdfPath !== "generated" &&
    !quotation.pdfPath.startsWith("r2:") &&
    fs.existsSync(quotation.pdfPath)
  ) {
    return fs.readFileSync(quotation.pdfPath);
  }
  const fallbackDir = getPdfDir();
  const fallback = fallbackDir ? path.join(fallbackDir, `${quotation.id}.pdf`) : "";
  if (!workerEnv && fallback && fs.existsSync(fallback)) return fs.readFileSync(fallback);
  return null;
}

async function generatePdf(id) {
  const quotation = await quotationService.getQuotation(id);
  if (!quotation) throw httpError(404, "Quotation not found.");

  const filename = buildPdfFilename(quotation);
  const html = renderQuotationHtml(quotation);
  const workerEnv = getWorkerEnv();
  const pdfBuffer = await renderPdfBytes(html, workerEnv);
  const pdfPath = await storePdf(id, pdfBuffer, workerEnv);

  const nextStatus = quotation.status === "draft" ? "generated" : quotation.status;
  const updated = await prisma.quotation.update({
    where: { id },
    data: { pdfPath, status: nextStatus },
    include: { items: { orderBy: { serialNumber: "asc" } }, terms: true, customer: true },
  });

  return {
    quotation: quotationService.serializeQuotation(updated),
    filename,
    buffer: pdfBuffer,
    path: pdfPath,
  };
}

async function getPdfBuffer(quotation) {
  const workerEnv = getWorkerEnv();
  const stored = await readStoredPdf(quotation, workerEnv);
  if (stored) return stored;
  const generated = await generatePdf(quotation.id);
  return generated.buffer;
}

async function getPdf(quotation) {
  const buffer = await getPdfBuffer(quotation);
  return { buffer, filename: buildPdfFilename(quotation) };
}

module.exports = { generatePdf, getPdfBuffer, getPdf, get PDF_DIR() { return getPdfDir(); } };
