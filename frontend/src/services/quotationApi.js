import { api } from "./api";

export const quotationApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return api(`/quotations${query ? `?${query}` : ""}`);
  },
  nextNumber: (date) => api(`/quotations/next-number${date ? `?date=${date}` : ""}`),
  get: (id) => api(`/quotations/${id}`),
  create: (body) => api("/quotations", { method: "POST", body }),
  update: (id, body) => api(`/quotations/${id}`, { method: "PUT", body }),
  remove: (id) => api(`/quotations/${id}`, { method: "DELETE" }),
  duplicate: (id) => api(`/quotations/${id}/duplicate`, { method: "POST" }),
  generatePdf: (id, body) => api(`/quotations/${id}/generate-pdf`, { method: "POST", body }),
  downloadPdf: (id) => api(`/quotations/${id}/pdf`, { isBlob: true }),
};

export const customerApi = {
  list: (search = "") => api(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  create: (body) => api("/customers", { method: "POST", body }),
  update: (id, body) => api(`/customers/${id}`, { method: "PUT", body }),
  remove: (id) => api(`/customers/${id}`, { method: "DELETE" }),
};

export const settingsApi = {
  get: () => api("/settings"),
  update: (body) => api("/settings", { method: "PUT", body }),
};

export const dashboardApi = {
  get: () => api("/dashboard"),
};

export const authApi = {
  login: (body) => api("/auth/login", { method: "POST", body }),
  me: () => api("/auth/me"),
};
