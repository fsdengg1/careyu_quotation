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

function isTechnicalMessage(message) {
  return /invocation|connection slots|ECONN|internal server error|too many database|terminated unexpectedly|request failed|\b(400|401|403|404|500|502|503)\b/i.test(
    message
  );
}

function friendlyMessage(status, data = {}, path = "") {
  const raw = String(data.message || "").trim();
  const login = path.includes("/auth/login");
  if (raw && !isTechnicalMessage(raw)) return raw;
  if (status === 401) return "Invalid email or password.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "That item could not be found.";
  if (status === 429 || data.error === "PDF_GENERATION_RATE_LIMITED") {
    return "Please wait a moment and try again.";
  }
  if (status === 400) {
    return data.details?.length ? data.details.join(" ") : "Please check the details and try again.";
  }
  if (status === 503 || data.error === "DB_BUSY" || status >= 500) {
    return login
      ? "Unable to sign in right now. Please wait a few seconds and try again."
      : "Unable to connect right now. Please wait a few seconds and try again.";
  }
  return "Something went wrong. Please try again.";
}

function apiError(status, data = {}, retryAfter, path = "") {
  const error = new Error(friendlyMessage(status, data, path));
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

  let response;
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
    });
  } catch {
    throw apiError(503, { error: "DB_BUSY" }, 5, path);
  }

  if (response.status === 401) {
    localStorage.removeItem("careyu_token");
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  const retryAfter = response.headers.get("Retry-After");

  if (isBlob) {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw apiError(response.status, data, retryAfter, path);
    }
    const blob = await response.blob();
    blob.filename = filenameFromDisposition(response.headers.get("Content-Disposition"));
    return blob;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw apiError(response.status, data, retryAfter, path);
  }
  return data;
}
