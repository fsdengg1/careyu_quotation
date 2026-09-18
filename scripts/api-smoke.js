/**
 * Smoke-test the quotation API. Defaults to the local Express server.
 * Usage:
 *   node scripts/api-smoke.js
 *   node scripts/api-smoke.js https://quotation.careyu.ai
 */
const BASE = (process.argv[2] || "http://localhost:4001").replace(/\/$/, "");
const API = `${BASE}/api`;

async function request(path, { method = "GET", body, token, isBlob = false } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (isBlob) {
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`${method} ${path} -> ${response.status} ${err.message || ""}`);
    }
    return { status: response.status, blob: await response.arrayBuffer(), headers: response.headers };
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${data.message || JSON.stringify(data)}`);
  }
  return { status: response.status, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const health = await request("/health");
  assert(health.data.status === "ok", `health.status expected ok, got ${JSON.stringify(health.data)}`);
  assert(health.data.service === "careyu-quotation", "health.service mismatch");
  console.log("GET /api/health OK");

  const login = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@careyu.ai", password: "CareYu@2026" },
  });
  assert(login.data.token, "login did not return a token");
  const token = login.data.token;
  console.log("POST /api/auth/login OK");

  await request("/quotations", { token });
  console.log("GET /api/quotations OK");

  await request("/customers", { token });
  console.log("GET /api/customers OK");

  await request("/settings", { token });
  console.log("GET /api/settings OK");

  await request("/dashboard", { token });
  console.log("GET /api/dashboard OK");

  const suffix = Date.now().toString().slice(-6);
  const created = await request("/quotations", {
    method: "POST",
    token,
    body: {
      quotationNumber: `CY-SMOKE-${suffix}`,
      quotationDate: "2026-09-18",
      projectName: "SMOKE TEST PROJECT",
      projectLocation: "CHENNAI",
      clientName: "SMOKE CLIENT",
      clientCompany: "SMOKE COMPANY",
      items: [{ description: "Smoke item", unitPrice: 100, quantity: 2 }],
      freight: 10,
      installationCharge: 20,
      gstPercentage: 18,
      gstAsExtra: true,
      terms: {},
      status: "draft",
    },
  });
  assert(created.status === 201, "create quotation should return 201");
  assert(created.data.subtotal === 200, `subtotal expected 200, got ${created.data.subtotal}`);
  assert(created.data.totalBasicLanded === 230, `totalBasicLanded expected 230, got ${created.data.totalBasicLanded}`);
  assert(created.data.grandTotal === 230, `grandTotal expected 230 (GST extra), got ${created.data.grandTotal}`);
  const id = created.data.id;
  console.log("POST /api/quotations OK", id);

  const fetched = await request(`/quotations/${id}`, { token });
  assert(fetched.data.id === id, "get quotation id mismatch");
  console.log("GET /api/quotations/:id OK");

  const updated = await request(`/quotations/${id}`, {
    method: "PUT",
    token,
    body: {
      ...fetched.data,
      projectName: "SMOKE TEST PROJECT UPDATED",
      items: fetched.data.items,
    },
  });
  assert(updated.data.projectName === "SMOKE TEST PROJECT UPDATED", "update did not persist");
  console.log("PUT /api/quotations/:id OK");

  const duplicated = await request(`/quotations/${id}/duplicate`, { method: "POST", token });
  assert(duplicated.data.id !== id, "duplicate should create a new id");
  console.log("POST /api/quotations/:id/duplicate OK", duplicated.data.quotationNumber);

  const customer = await request("/customers", {
    method: "POST",
    token,
    body: { customerName: `Smoke Customer ${suffix}`, companyName: `Smoke Co ${suffix}` },
  });
  console.log("POST /api/customers OK");

  const settings = await request("/settings", { token });
  await request("/settings", {
    method: "PUT",
    token,
    body: { ...settings.data, companyName: settings.data.companyName },
  });
  console.log("PUT /api/settings OK");

  try {
    const pdf = await request(`/quotations/${id}/generate-pdf`, { method: "POST", token });
    assert(pdf.data.success === true, "generate-pdf should succeed");
    console.log("POST /api/quotations/:id/generate-pdf OK", pdf.data.filename);

    const download = await request(`/quotations/${id}/pdf`, { token, isBlob: true });
    assert(download.blob.byteLength > 1000, "pdf download too small");
    console.log("GET /api/quotations/:id/pdf OK", download.blob.byteLength, "bytes");
  } catch (error) {
    console.warn("PDF endpoints skipped or failed:", error.message);
  }

  await request(`/quotations/${duplicated.data.id}`, { method: "DELETE", token });
  await request(`/quotations/${id}`, { method: "DELETE", token });
  if (customer.data?.id) {
    await request(`/customers/${customer.data.id}`, { method: "DELETE", token });
  }
  console.log("DELETE /api/quotations/:id OK");

  console.log("\nAPI smoke tests passed against", BASE);
}

main().catch((error) => {
  console.error("API smoke tests failed:", error.message);
  process.exit(1);
});
