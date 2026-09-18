const prisma = require("../models/prisma");
const { calculateQuotation } = require("../utils/calculations");
const { datePrefix, formatQuotationNumber } = require("../utils/quotationNumber");
const { DEFAULT_COMPANY, DEFAULT_TERMS } = require("../utils/defaults");
const { httpError, validateQuotationPayload } = require("../middleware/validate");

function snapshotFromSettings(settings) {
  const source = settings || DEFAULT_COMPANY;
  return {
    companyName: source.companyName,
    address: source.address,
    website: source.website,
    email: source.email,
    phone: source.phone,
    logoPath: source.logoPath || "/assets/careyu-logo.png",
    signatureName: source.signatureName || "",
    signatureDesignation: source.signatureDesignation || "",
    footerTagline: source.footerTagline,
  };
}

function mergeCompanySnapshot(existing, incoming) {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? existing
      : snapshotFromSettings(DEFAULT_COMPANY);
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return base;
  return {
    ...base,
    ...incoming,
    signatureName: incoming.signatureName != null ? String(incoming.signatureName) : base.signatureName || "",
    signatureDesignation:
      incoming.signatureDesignation != null
        ? String(incoming.signatureDesignation)
        : base.signatureDesignation || "",
  };
}

function pickTerm(value, fallback) {
  return value == null ? fallback : String(value);
}

function termsFromBody(body, settings) {
  const t = body.terms || {};
  const fallbacks = {
    softwareDevelopment: settings?.defaultSoftwareDevelopment || DEFAULT_TERMS.softwareDevelopment,
    quotationValidity: settings?.defaultQuotationValidity || DEFAULT_TERMS.quotationValidity,
    paymentTerms: settings?.defaultPaymentTerms || DEFAULT_TERMS.paymentTerms,
    warranty: settings?.defaultWarranty || DEFAULT_TERMS.warranty,
    generalTerms: DEFAULT_TERMS.generalTerms,
    jurisdiction: DEFAULT_TERMS.jurisdiction,
    liability: DEFAULT_TERMS.liability,
    salesTerms: DEFAULT_TERMS.salesTerms,
    insurance: DEFAULT_TERMS.insurance,
    arbitration: DEFAULT_TERMS.arbitration,
    amcNote: settings?.defaultAmcNote || DEFAULT_TERMS.amcNote,
  };
  if (body.terms == null) return fallbacks;
  return {
    softwareDevelopment: pickTerm(t.softwareDevelopment, ""),
    quotationValidity: pickTerm(t.quotationValidity, ""),
    paymentTerms: pickTerm(t.paymentTerms, ""),
    warranty: pickTerm(t.warranty, ""),
    generalTerms: DEFAULT_TERMS.generalTerms,
    jurisdiction: DEFAULT_TERMS.jurisdiction,
    liability: DEFAULT_TERMS.liability,
    salesTerms: DEFAULT_TERMS.salesTerms,
    insurance: DEFAULT_TERMS.insurance,
    arbitration: DEFAULT_TERMS.arbitration,
    amcNote: pickTerm(t.amcNote, ""),
  };
}

async function getSettings() {
  const settings = await prisma.companySettings.findUnique({ where: { id: "default" } });
  return settings || DEFAULT_COMPANY;
}

async function nextQuotationNumber(date = new Date()) {
  const prefix = datePrefix(date);
  const latest = await prisma.quotation.findFirst({
    where: { quotationNumber: { startsWith: prefix } },
    orderBy: { quotationNumber: "desc" },
  });
  const sequence = latest ? Number(latest.quotationNumber.split("-")[1] || 0) + 1 : 1;
  return formatQuotationNumber(date, sequence);
}

async function assertUniqueNumber(quotationNumber, excludeId) {
  const existing = await prisma.quotation.findUnique({
    where: { quotationNumber },
  });
  if (existing && existing.id !== excludeId) {
    throw httpError(409, "Quotation number already exists. Please use a unique number.");
  }
}

function serializeQuotation(quotation) {
  if (!quotation) return null;
  const totals = calculateQuotation(
    quotation.items,
    quotation.freight,
    quotation.installationCharge,
    quotation.gstPercentage,
    quotation.gstAsExtra
  );
  return {
    ...quotation,
    subtotal: Number(quotation.subtotal),
    freight: Number(quotation.freight),
    installationCharge: Number(quotation.installationCharge),
    gstPercentage: Number(quotation.gstPercentage),
    gstAsExtra: quotation.gstAsExtra !== false,
    gstAmount: Number(quotation.gstAmount),
    grandTotal: Number(quotation.grandTotal),
    totalBasicLanded: totals.totalBasicLanded,
    items: (quotation.items || []).map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      totalAmount: Number(item.totalAmount),
    })),
  };
}

async function listQuotations(query = {}) {
  const { search, status, client, from, to } = query;
  const where = {};
  if (status) where.status = status;
  if (client) {
    where.OR = [
      { clientCompany: { contains: client, mode: "insensitive" } },
      { clientName: { contains: client, mode: "insensitive" } },
    ];
  }
  if (from || to) {
    where.quotationDate = {};
    if (from) where.quotationDate.gte = new Date(from);
    if (to) where.quotationDate.lte = new Date(to);
  }
  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { quotationNumber: { contains: search, mode: "insensitive" } },
          { projectName: { contains: search, mode: "insensitive" } },
          { clientName: { contains: search, mode: "insensitive" } },
          { clientCompany: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const rows = await prisma.quotation.findMany({
    where,
    include: { items: { orderBy: { serialNumber: "asc" } }, terms: true, customer: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeQuotation);
}

async function getQuotation(id) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { items: { orderBy: { serialNumber: "asc" } }, terms: true, customer: true },
  });
  if (!quotation) throw httpError(404, "Quotation not found.");
  return serializeQuotation(quotation);
}

async function createQuotation(body, userId) {
  const { errors } = validateQuotationPayload(body, { forGenerate: body.status === "generated" });
  if (errors.length) throw httpError(400, "Validation failed.", errors);

  const settings = await getSettings();
  let quotationNumber = String(body.quotationNumber || "").trim();
  await assertUniqueNumber(quotationNumber);

  const totals = calculateQuotation(
    body.items,
    body.freight,
    body.installationCharge,
    body.gstPercentage,
    body.gstAsExtra
  );

  const created = await prisma.quotation.create({
    data: {
      quotationNumber,
      quotationDate: new Date(body.quotationDate),
      projectName: String(body.projectName || "").trim(),
      projectLocation: String(body.projectLocation || "").trim(),
      clientName: String(body.clientName || "").trim(),
      clientCompany: String(body.clientCompany || "").trim(),
      customerId: body.customerId || null,
      subtotal: totals.subtotal,
      freight: totals.freight,
      installationCharge: totals.installationCharge,
      gstPercentage: totals.gstPercentage,
      gstAsExtra: totals.gstAsExtra,
      gstAmount: totals.gstAmount,
      grandTotal: totals.grandTotal,
      amountInWords: totals.amountInWords,
      status: body.status || "draft",
      companySnapshot: mergeCompanySnapshot(snapshotFromSettings(settings), body.companySnapshot),
      createdById: userId || null,
      items: {
        create: totals.items.map((item) => ({
          serialNumber: item.serialNumber,
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalAmount: item.totalAmount,
        })),
      },
      terms: { create: termsFromBody(body, settings) },
    },
    include: { items: { orderBy: { serialNumber: "asc" } }, terms: true, customer: true },
  });

  return serializeQuotation(created);
}

async function updateQuotation(id, body, { forGenerate = false } = {}) {
  const existing = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true, terms: true },
  });
  if (!existing) throw httpError(404, "Quotation not found.");

  const payload = {
    quotationNumber: body.quotationNumber ?? existing.quotationNumber,
    quotationDate: body.quotationDate ?? existing.quotationDate,
    projectName: body.projectName ?? existing.projectName,
    projectLocation: body.projectLocation ?? existing.projectLocation,
    clientName: body.clientName ?? existing.clientName,
    clientCompany: body.clientCompany ?? existing.clientCompany,
    items: body.items ?? existing.items,
    freight: body.freight ?? existing.freight,
    installationCharge: body.installationCharge ?? existing.installationCharge,
    gstPercentage: body.gstPercentage ?? existing.gstPercentage,
    gstAsExtra: body.gstAsExtra ?? existing.gstAsExtra,
    terms: body.terms ?? existing.terms,
    status: body.status ?? existing.status,
    customerId: body.customerId !== undefined ? body.customerId : existing.customerId,
  };

  const { errors } = validateQuotationPayload(payload, {
    forGenerate: forGenerate || payload.status === "generated",
  });
  if (errors.length) throw httpError(400, "Validation failed.", errors);

  await assertUniqueNumber(String(payload.quotationNumber).trim(), id);

  const totals = calculateQuotation(
    payload.items,
    payload.freight,
    payload.installationCharge,
    payload.gstPercentage,
    payload.gstAsExtra
  );

  const updated = await prisma.$transaction(async (tx) => {
    await tx.quotationItem.deleteMany({ where: { quotationId: id } });
    return tx.quotation.update({
      where: { id },
      data: {
        quotationNumber: String(payload.quotationNumber).trim(),
        quotationDate: new Date(payload.quotationDate),
        projectName: String(payload.projectName || "").trim(),
        projectLocation: String(payload.projectLocation || "").trim(),
        clientName: String(payload.clientName || "").trim(),
        clientCompany: String(payload.clientCompany || "").trim(),
        customerId: payload.customerId || null,
        subtotal: totals.subtotal,
        freight: totals.freight,
        installationCharge: totals.installationCharge,
        gstPercentage: totals.gstPercentage,
        gstAsExtra: totals.gstAsExtra,
        gstAmount: totals.gstAmount,
        grandTotal: totals.grandTotal,
        amountInWords: totals.amountInWords,
        status: payload.status,
        companySnapshot: mergeCompanySnapshot(existing.companySnapshot, body.companySnapshot),
        items: {
          create: totals.items.map((item) => ({
            serialNumber: item.serialNumber,
            description: item.description,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalAmount: item.totalAmount,
          })),
        },
        terms: {
          upsert: {
            create: termsFromBody(payload, null),
            update: termsFromBody(payload, null),
          },
        },
      },
      include: { items: { orderBy: { serialNumber: "asc" } }, terms: true, customer: true },
    });
  });

  return serializeQuotation(updated);
}

async function deleteQuotation(id) {
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) throw httpError(404, "Quotation not found.");
  await prisma.quotation.delete({ where: { id } });
  return { success: true };
}

async function duplicateQuotation(id, userId) {
  const source = await getQuotation(id);
  const settings = await getSettings();
  const quotationNumber = await nextQuotationNumber(new Date());
  return createQuotation(
    {
      quotationNumber,
      quotationDate: new Date().toISOString().slice(0, 10),
      projectName: source.projectName,
      projectLocation: source.projectLocation,
      clientName: source.clientName,
      clientCompany: source.clientCompany,
      customerId: source.customerId,
      items: source.items,
      freight: source.freight,
      installationCharge: source.installationCharge,
      gstPercentage: source.gstPercentage,
      gstAsExtra: source.gstAsExtra,
      terms: source.terms,
      status: "draft",
      companySnapshot: snapshotFromSettings(settings),
    },
    userId
  );
}

async function dashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [total, drafts, generated, monthQuotes, aggregates] = await Promise.all([
    prisma.quotation.count(),
    prisma.quotation.count({ where: { status: "draft" } }),
    prisma.quotation.count({ where: { status: { in: ["generated", "sent", "approved"] } } }),
    prisma.quotation.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.quotation.aggregate({ _sum: { grandTotal: true } }),
  ]);
  const recent = await prisma.quotation.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { items: true },
  });
  return {
    totalQuotations: total,
    draftQuotations: drafts,
    generatedQuotations: generated,
    thisMonthQuotations: monthQuotes,
    totalQuotationValue: Number(aggregates._sum.grandTotal || 0),
    recent: recent.map(serializeQuotation),
  };
}

module.exports = {
  snapshotFromSettings,
  getSettings,
  nextQuotationNumber,
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  duplicateQuotation,
  dashboardStats,
  serializeQuotation,
};
