import { quotationApi } from "../services/quotationApi";

const locks = new Map();

function userPdfMessage(error) {
  if (error?.status === 429 || error?.code === "PDF_GENERATION_RATE_LIMITED") {
    return "PDF generation is temporarily busy. Please wait a moment and try again.";
  }
  return error?.message || "Unable to generate PDF.";
}

function cooldownSeconds(error) {
  const parsed = Number(error?.retryAfter);
  if (Number.isFinite(parsed) && parsed > 0) return Math.min(60, Math.max(1, Math.round(parsed)));
  if (error?.status === 429 || error?.code === "PDF_GENERATION_RATE_LIMITED") return 20;
  return 0;
}

function triggerBlobDownload(blob, fallbackName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = blob.filename || fallbackName || "quotation.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

export function getPdfLock(id) {
  return locks.get(id) || { phase: "idle", seconds: 0 };
}

export async function downloadQuotationPdf(id, fallbackName, onState) {
  const current = locks.get(id);
  if (current?.promise) return current.promise;
  if (current?.cooldownUntil && current.cooldownUntil > Date.now()) {
    const seconds = Math.ceil((current.cooldownUntil - Date.now()) / 1000);
    onState?.({ phase: "cooldown", seconds });
    const error = new Error("PDF generation is temporarily busy. Please wait a moment and try again.");
    error.status = 429;
    throw error;
  }

  const promise = (async () => {
    onState?.({ phase: "generating", seconds: 0 });
    try {
      const blob = await quotationApi.downloadPdf(id);
      triggerBlobDownload(blob, fallbackName);
      locks.set(id, { phase: "idle", seconds: 0 });
      onState?.({ phase: "idle", seconds: 0 });
      return blob;
    } catch (error) {
      const seconds = cooldownSeconds(error);
      if (seconds) {
        locks.set(id, { phase: "cooldown", seconds, cooldownUntil: Date.now() + seconds * 1000 });
        onState?.({ phase: "cooldown", seconds });
      } else {
        locks.set(id, { phase: "idle", seconds: 0 });
        onState?.({ phase: "idle", seconds: 0 });
      }
      error.message = userPdfMessage(error);
      throw error;
    }
  })();

  locks.set(id, { phase: "generating", seconds: 0, promise });
  try {
    return await promise;
  } finally {
    const next = locks.get(id);
    if (next) delete next.promise;
  }
}
