const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const prisma = require("../models/prisma");
const { renderQuotationHtml } = require("../pdf/template");
const { buildPdfFilename } = require("../utils/pdfFilename");
const { httpError } = require("../middleware/validate");
const quotationService = require("./quotationService");

const PDF_DIR = path.join(__dirname, "../../storage/pdfs");

function resolveChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function generatePdf(id) {
  const quotation = await quotationService.getQuotation(id);
  if (!quotation) throw httpError(404, "Quotation not found.");

  fs.mkdirSync(PDF_DIR, { recursive: true });
  const filename = buildPdfFilename(quotation);
  const outputPath = path.join(PDF_DIR, `${quotation.id}.pdf`);
  const html = renderQuotationHtml(quotation);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromePath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 120000 });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await browser.close();
  }

  const nextStatus = quotation.status === "draft" ? "generated" : quotation.status;
  const updated = await prisma.quotation.update({
    where: { id },
    data: { pdfPath: outputPath, status: nextStatus },
    include: { items: { orderBy: { serialNumber: "asc" } }, terms: true, customer: true },
  });

  return {
    quotation: quotationService.serializeQuotation(updated),
    filename,
    path: outputPath,
  };
}

function getPdfPath(quotation) {
  if (quotation.pdfPath && fs.existsSync(quotation.pdfPath)) return quotation.pdfPath;
  const fallback = path.join(PDF_DIR, `${quotation.id}.pdf`);
  if (fs.existsSync(fallback)) return fallback;
  return null;
}

module.exports = { generatePdf, getPdfPath, PDF_DIR };
