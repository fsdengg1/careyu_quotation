const fs = require("fs");
const path = require("path");

const API = "http://localhost:4001/api";

async function main() {
  const login = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@careyu.ai", password: "CareYu@2026" }),
  }).then((r) => r.json());

  if (!login.token) {
    throw new Error(`Login failed: ${JSON.stringify(login)}`);
  }
  const auth = { Authorization: `Bearer ${login.token}`, "Content-Type": "application/json" };

  const next = await fetch(`${API}/quotations/next-number`, { headers: auth }).then((r) => r.json());
  console.log("Next number", next.quotationNumber);

  const payload = {
    quotationNumber: next.quotationNumber,
    quotationDate: "2026-09-11",
    projectName: "HERO - MAINLINE VISION INSPECTION SYSTEM",
    projectLocation: "Sricity, Andhra Pradesh, India",
    clientName: "HERO MOTOCORP PVT LTD.",
    clientCompany: "HERO MOTOCORP PVT LTD.",
    items: [
      {
        description:
          "Mainline Vision Inspection System.\nVision Integration - Mechanical Hardwares + Electrical Hardwares +Care Yu Vision Software with New part teaching Module (3Years AMC)",
        unitPrice: 2588864,
        quantity: 1,
      },
      {
        description: "Orbbec Camera + Power Cables",
        unitPrice: 89950,
        quantity: 4,
      },
    ],
    freight: 25000,
    installationCharge: 125000,
    gstPercentage: 18,
    gstAsExtra: false,
    terms: {
      softwareDevelopment: "6-8 Weeks from the date of receipt of confirmed order with advance & PO",
      quotationValidity: "15 Days From the Date of this Offer",
      paymentTerms: "40% advance along with purchase order",
      warranty: "12 months from the date of commissioning",
      generalTerms: "All orders are subject to our acceptance in writing",
      jurisdiction: "All disputes are subject to Thoothukudi Jurisdiction only",
      liability: "offer is subject to no claim for damages",
      salesTerms: "offer is subject to general terms and conditions of sales",
      insurance: "Insurance shall be to the purchaser's account",
      arbitration: "ARBITRATION ACT 1996",
      amcNote: "AMC will be applicable at an additional cost starting from Year 4.",
    },
    status: "draft",
  };

  const created = await fetch(`${API}/quotations`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify(payload),
  }).then((r) => r.json());

  if (!created.id) throw new Error(`Create failed: ${JSON.stringify(created)}`);
  console.log("Created", created.id);
  console.log("Totals", {
    subtotal: created.subtotal,
    totalBasicLanded: created.totalBasicLanded,
    gstAmount: created.gstAmount,
    grandTotal: created.grandTotal,
    amountInWords: created.amountInWords,
  });

  if (created.subtotal !== 2948664) throw new Error(`Bad subtotal ${created.subtotal}`);
  if (created.totalBasicLanded !== 3098664) throw new Error(`Bad landed ${created.totalBasicLanded}`);
  if (created.gstAmount !== 557759.52) throw new Error(`Bad GST ${created.gstAmount}`);
  if (created.grandTotal !== 3656423.52) throw new Error(`Bad grand ${created.grandTotal}`);

  const updated = await fetch(`${API}/quotations/${created.id}`, {
    method: "PUT",
    headers: auth,
    body: JSON.stringify({ ...payload, projectName: "HERO - MAINLINE VISION INSPECTION SYSTEM" }),
  }).then((r) => r.json());
  console.log("Updated status", updated.status);

  const duplicated = await fetch(`${API}/quotations/${created.id}/duplicate`, {
    method: "POST",
    headers: auth,
  }).then((r) => r.json());
  console.log("Duplicated", duplicated.quotationNumber);

  console.log("Generating PDF...");
  const pdf = await fetch(`${API}/quotations/${created.id}/generate-pdf`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ ...payload, status: "generated" }),
  }).then((r) => r.json());
  console.log("PDF", pdf.filename, pdf.success);

  const filePath = path.join(__dirname, "storage/pdfs", `${created.id}.pdf`);
  if (!fs.existsSync(filePath)) throw new Error("PDF file missing");
  const buf = fs.readFileSync(filePath);
  const text = buf.toString("latin1");
  const countMatch = text.match(/\/Count\s+(\d+)/);
  console.log("PDF bytes", buf.length, "page count marker", countMatch && countMatch[1]);
  if (!countMatch || countMatch[1] !== "5") {
    console.warn("Could not confirm 5 pages from PDF catalog; marker was", countMatch && countMatch[1]);
  }

  const dash = await fetch(`${API}/dashboard`, { headers: auth }).then((r) => r.json());
  console.log("Dashboard", {
    total: dash.totalQuotations,
    drafts: dash.draftQuotations,
    generated: dash.generatedQuotations,
  });

  console.log("FLOW OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
