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

  if (isBlob) {
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Request failed." }));
      throw new Error(err.message || "Request failed.");
    }
    const blob = await response.blob();
    blob.filename = filenameFromDisposition(response.headers.get("Content-Disposition"));
    return blob;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.details?.length ? data.details.join(" ") : data.message || "Request failed.";
    const error = new Error(message);
    error.details = data.details;
    throw error;
  }
  return data;
}
