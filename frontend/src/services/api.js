const API = "/api";

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
    return response.blob();
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
