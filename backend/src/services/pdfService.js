const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const prisma = require("../models/prisma");
const { renderQuotationHtml } = require("../pdf/template");
const { buildPdfFilename } = require("../utils/pdfFilename");
const { httpError } = require("../middleware/validate");
const quotationService = require("./quotationService");

const memoryCache = new Map();
const inFlight = new Map();
const MEMORY_CACHE_LIMIT = 20;
const PDF_OPTIONS = {
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
};

let browserLock = Promise.resolve();

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

function makeRequestId() {
  return `PDF-${crypto.randomBytes(4).toString("hex")}`;
}

function logPdf(event) {
  console.log(JSON.stringify({ service: "pdf", ...event }));
}

function pdfFingerprint(quotation) {
  const payload = {
    n: quotation.quotationNumber,
    d: quotation.quotationDate,
    p: quotation.projectName,
    l: quotation.projectLocation,
    cn: quotation.clientName,
    cc: quotation.clientCompany,
    items: (quotation.items || []).map((item) => [
      item.serialNumber,
      item.description,
      Number(item.unitPrice),
      Number(item.quantity),
      Number(item.totalAmount),
    ]),
    f: Number(quotation.freight),
    i: Number(quotation.installationCharge),
    g: Number(quotation.gstPercentage),
    x: quotation.gstAsExtra !== false,
    t: quotation.terms,
    s: quotation.companySnapshot,
  };
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 20);
}

function cacheKey(quotationId, fingerprint) {
  return `${quotationId}/${fingerprint}`;
}

function toBuffer(bytes) {
  if (!bytes) return Buffer.alloc(0);
  if (Buffer.isBuffer(bytes)) return bytes;
  return Buffer.from(bytes);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error) {
  const message = String(error?.message || "");
  return (
    error?.status === 429 ||
    error?.statusCode === 429 ||
    /\b429\b/.test(message) ||
    /rate limit/i.test(message) ||
    /time limit exceeded for today/i.test(message)
  );
}

function isDailyLimitError(error) {
  return /time limit exceeded for today/i.test(String(error?.message || ""));
}

function rateLimitError(requestId, retryAfter = 20, error = null) {
  const wrapped = httpError(
    429,
    "PDF generation is temporarily rate limited. Please try again shortly."
  );
  wrapped.code = "PDF_GENERATION_RATE_LIMITED";
  wrapped.requestId = requestId;
  wrapped.retryAfter = Number(retryAfter) || 20;
  if (error && isDailyLimitError(error)) {
    logPdf({ msg: "pdf_daily_browser_limit", requestId });
  }
  return wrapped;
}

function failedError(requestId) {
  const wrapped = httpError(500, "Unable to generate PDF.");
  wrapped.code = "PDF_GENERATION_FAILED";
  wrapped.requestId = requestId;
  return wrapped;
}

function withBrowserLock(fn) {
  const run = browserLock.then(fn, fn);
  browserLock = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function rememberPdf(key, buffer, filename) {
  memoryCache.set(key, { buffer, filename, storedAt: Date.now() });
  while (memoryCache.size > MEMORY_CACHE_LIMIT) {
    const oldest = memoryCache.keys().next().value;
    memoryCache.delete(oldest);
  }
}

async function cacheApiGet(key) {
  try {
    if (typeof caches === "undefined" || !caches.default) return null;
    const match = await caches.default.match(new Request(`https://pdf-cache.careyu.internal/${key}`));
    if (!match) return null;
    return toBuffer(await match.arrayBuffer());
  } catch {
    return null;
  }
}

async function cacheApiPut(key, buffer) {
  try {
    if (typeof caches === "undefined" || !caches.default) return;
    await caches.default.put(
      new Request(`https://pdf-cache.careyu.internal/${key}`),
      new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "public, max-age=604800",
        },
      })
    );
  } catch {
    // Cache API is optional.
  }
}

async function readCachedPdf(quotation, fingerprint) {
  const key = cacheKey(quotation.id, fingerprint);
  const filename = buildPdfFilename(quotation);
  const memory = memoryCache.get(key);
  if (memory?.buffer?.length) return { buffer: memory.buffer, filename, source: "memory" };

  const fromCacheApi = await cacheApiGet(key);
  if (fromCacheApi?.length) {
    rememberPdf(key, fromCacheApi, filename);
    return { buffer: fromCacheApi, filename, source: "cache-api" };
  }

  const workerEnv = getWorkerEnv();
  if (workerEnv?.PDF_BUCKET) {
    const object = await workerEnv.PDF_BUCKET.get(`pdfs/${key}.pdf`);
    if (object) {
      const buffer = toBuffer(await object.arrayBuffer());
      rememberPdf(key, buffer, filename);
      return { buffer, filename, source: "r2" };
    }
  }

  if (!workerEnv) {
    const pdfDir = getPdfDir();
    const filePath = pdfDir ? path.join(pdfDir, `${quotation.id}-${fingerprint}.pdf`) : "";
    if (filePath && fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      rememberPdf(key, buffer, filename);
      return { buffer, filename, source: "disk" };
    }
  }

  return null;
}

async function persistPdf(quotation, fingerprint, buffer, filename) {
  const key = cacheKey(quotation.id, fingerprint);
  rememberPdf(key, buffer, filename);
  await cacheApiPut(key, buffer);

  const workerEnv = getWorkerEnv();
  if (workerEnv?.PDF_BUCKET) {
    const objectKey = `pdfs/${key}.pdf`;
    await workerEnv.PDF_BUCKET.put(objectKey, buffer, {
      httpMetadata: { contentType: "application/pdf" },
    });
    return `r2:${objectKey}`;
  }
  if (!workerEnv) {
    const pdfDir = getPdfDir();
    fs.mkdirSync(pdfDir, { recursive: true });
    const outputPath = path.join(pdfDir, `${quotation.id}-${fingerprint}.pdf`);
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }
  return `fp:${fingerprint}`;
}

function sessionIdOf(session) {
  return session?.sessionId || session?.id || null;
}

async function acquireWorkerBrowser(puppeteer, binding, requestId) {
  try {
    if (typeof puppeteer.sessions === "function") {
      const sessions = await puppeteer.sessions(binding);
      const free = (sessions || []).find((session) => !session.connectionId);
      const sessionId = sessionIdOf(free);
      if (sessionId) {
        try {
          const browser = await puppeteer.connect(binding, sessionId);
          logPdf({ msg: "pdf_browser_reused", requestId, sessionId });
          return { browser, launched: false };
        } catch (error) {
          logPdf({ msg: "pdf_browser_reconnect_failed", requestId, error: String(error.message || error) });
        }
      }
    }
  } catch (error) {
    logPdf({ msg: "pdf_browser_sessions_failed", requestId, error: String(error.message || error) });
  }

  try {
    if (typeof puppeteer.limits === "function") {
      const limits = await puppeteer.limits(binding);
      const allowed = limits?.allowedBrowserAcquisitions;
      const waitMs = Number(limits?.timeUntilNextAllowedBrowserAcquisition || 0);
      logPdf({
        msg: "pdf_browser_limits",
        requestId,
        allowed,
        waitMs,
        maxConcurrentSessions: limits?.maxConcurrentSessions,
        activeSessions: Array.isArray(limits?.activeSessions) ? limits.activeSessions.length : undefined,
      });
      if (allowed === 0 && waitMs > 2500) {
        throw rateLimitError(requestId, Math.max(1, Math.ceil(waitMs / 1000)));
      }
      if (allowed === 0 && waitMs > 0) {
        await sleep(waitMs);
      }
    }
  } catch (error) {
    if (error.status === 429) throw error;
    logPdf({ msg: "pdf_browser_limits_failed", requestId, error: String(error.message || error) });
  }

  let lastError = null;
  for (let attempt = 0; attempt <= 2; attempt += 1) {
    try {
      const browser = await puppeteer.launch(binding);
      logPdf({ msg: "pdf_browser_launched", requestId, attempt });
      return { browser, launched: true };
    } catch (error) {
      lastError = error;
      logPdf({
        msg: "pdf_browser_launch_failed",
        requestId,
        attempt,
        status: error.status || error.statusCode,
        error: String(error.message || error),
      });
      if (!isRateLimitError(error) || isDailyLimitError(error) || attempt === 2) {
        throw isRateLimitError(error) ? rateLimitError(requestId, 20, error) : error;
      }
      await sleep(attempt === 0 ? 1000 : 2000);
    }
  }
  throw isRateLimitError(lastError) ? rateLimitError(requestId, 20, lastError) : lastError;
}

async function closePage(page) {
  if (!page) return;
  try {
    await page.close();
  } catch {
    // Page may already be closed.
  }
}

async function releaseWorkerBrowser(browser) {
  if (!browser) return;
  try {
    if (typeof browser.disconnect === "function") {
      browser.disconnect();
      return;
    }
  } catch {
    // Fall through to close.
  }
  try {
    await browser.close();
  } catch {
    // Session may already be gone.
  }
}

async function renderPdfWithWorker(html, workerEnv, requestId) {
  if (!workerEnv.BROWSER) {
    throw failedError(requestId);
  }
  const puppeteer = require("@cloudflare/puppeteer");
  return withBrowserLock(async () => {
    const started = Date.now();
    let browser;
    let page;
    try {
      const acquired = await acquireWorkerBrowser(puppeteer, workerEnv.BROWSER, requestId);
      browser = acquired.browser;
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load", timeout: 120000 });
      let buffer;
      try {
        buffer = toBuffer(await page.pdf(PDF_OPTIONS));
      } catch {
        const stream = await page.createPDFStream(PDF_OPTIONS);
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        buffer = Buffer.concat(chunks);
      }
      logPdf({
        msg: "pdf_render_ok",
        requestId,
        durationMs: Date.now() - started,
        launched: acquired.launched,
        bytes: buffer.length,
      });
      return buffer;
    } catch (error) {
      if (error.status === 429) throw error;
      if (isRateLimitError(error)) throw rateLimitError(requestId, 20, error);
      logPdf({ msg: "pdf_render_failed", requestId, error: String(error.message || error) });
      throw failedError(requestId);
    } finally {
      await closePage(page);
      await releaseWorkerBrowser(browser);
    }
  });
}

async function renderPdfLocally(html) {
  const puppeteer = require("puppeteer");
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: resolveChromePath(),
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
    });
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 120000 });
    return toBuffer(await page.pdf(PDF_OPTIONS));
  } finally {
    await closePage(page);
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors.
      }
    }
  }
}

async function renderPdfBytes(html, workerEnv, requestId) {
  if (workerEnv) return renderPdfWithWorker(html, workerEnv, requestId);
  return renderPdfLocally(html);
}

async function generateFresh(quotation, fingerprint, requestId) {
  const started = Date.now();
  const filename = buildPdfFilename(quotation);
  const html = renderQuotationHtml(quotation);
  const workerEnv = getWorkerEnv();
  logPdf({ msg: "pdf_generate_start", requestId, quotationId: quotation.id, fingerprint });
  const pdfBuffer = await renderPdfBytes(html, workerEnv, requestId);
  const pdfPath = await persistPdf(quotation, fingerprint, pdfBuffer, filename);

  const nextStatus = quotation.status === "draft" ? "generated" : quotation.status;
  const updated = await prisma.quotation.update({
    where: { id: quotation.id },
    data: { pdfPath, status: nextStatus },
    include: { items: { orderBy: { serialNumber: "asc" } }, terms: true, customer: true },
  });

  logPdf({
    msg: "pdf_generate_ok",
    requestId,
    quotationId: quotation.id,
    fingerprint,
    durationMs: Date.now() - started,
    bytes: pdfBuffer.length,
  });

  return {
    quotation: quotationService.serializeQuotation(updated),
    filename,
    buffer: pdfBuffer,
    path: pdfPath,
    requestId,
    fingerprint,
  };
}

async function obtainPdf(quotation) {
  if (!quotation) throw httpError(404, "Quotation not found.");
  const requestId = makeRequestId();
  const fingerprint = pdfFingerprint(quotation);
  const cached = await readCachedPdf(quotation, fingerprint);
  if (cached) {
    logPdf({
      msg: "pdf_cache_hit",
      requestId,
      quotationId: quotation.id,
      fingerprint,
      source: cached.source,
    });
    return { ...cached, requestId, fingerprint, quotation };
  }

  const existing = inFlight.get(quotation.id);
  if (existing) {
    logPdf({ msg: "pdf_single_flight_join", requestId, quotationId: quotation.id, fingerprint });
    return existing;
  }

  const promise = generateFresh(quotation, fingerprint, requestId).finally(() => {
    if (inFlight.get(quotation.id) === promise) inFlight.delete(quotation.id);
  });
  inFlight.set(quotation.id, promise);
  return promise;
}

async function generatePdf(id) {
  const quotation = await quotationService.getQuotation(id);
  if (!quotation) throw httpError(404, "Quotation not found.");
  return obtainPdf(quotation);
}

async function getPdf(quotation) {
  const result = await obtainPdf(quotation);
  return { buffer: result.buffer, filename: result.filename, requestId: result.requestId };
}

async function getPdfBuffer(quotation) {
  const result = await obtainPdf(quotation);
  return result.buffer;
}

module.exports = {
  generatePdf,
  getPdfBuffer,
  getPdf,
  obtainPdf,
  get PDF_DIR() {
    return getPdfDir();
  },
};
