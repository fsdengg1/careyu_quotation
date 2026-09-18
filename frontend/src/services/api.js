const API = "/api"; // same-origin in production; Vite proxies /api to localhost:4001 in development

function filenameFromDisposition(header) {
  if (!header) return "";
  const utf = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf) {
    try {
      return decodeURIComponent(utf[1]);
    } catch {
      return utf[1];
    }
  }
  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted) return quoted[1];
  const plain = header.match(/filename=([^;]+)/i);
  return plain ? plain[1].trim() : "";
}

function apiError(status, data = {}, retryAfter) {
  const rateLimited = status === 429 || data.error === "PDF_GENERATION_RATE_LIMITED";
  const message = rateLimited
    ? "PDF generation is temporarily busy. Please wait a moment and try again."
    : data.details?.length
      ? data.details.join(" ")
      : data.message || "Request failed.";
  const error = new Error(message);
  error.status = status;
  error.code = data.error;
  error.requestId = data.requestId;
  error.retryAfter = retryAfter || data.retryAfter;
  error.details = data.details;
  return error;
}

export async function api(path, { method = "GET", body, isBlob = false } = {}) {
  const token = localStorage.getItem("careyu_token");
  const headers = {};
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

  if (response.status === 401) {
    localStorage.removeItem("careyu_token");
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  const retryAfter = response.headers.get("Retry-After");

  if (isBlob) {
    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: "Request failed." }));
      throw apiError(response.status, data, retryAfter);
    }
    const blob = await response.blob();
    blob.filename = filenameFromDisposition(response.headers.get("Content-Disposition"));
    return blob;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw apiError(response.status, data, retryAfter);
  }
  return data;
}
