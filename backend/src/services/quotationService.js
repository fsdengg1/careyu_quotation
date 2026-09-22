const { ILike, In, MoreThanOrEqual } = require("typeorm");
const { getDataSource } = require("../config/database");
const { repos } = require("../db");
const { newId } = require("../entities/helpers");
const { Quotation, QuotationItem, QuotationTerms } = require("../entities");
const { calculateQuotation } = require("../utils/calculations");
const { datePrefix, formatQuotationNumber } = require("../utils/quotationNumber");
const { DEFAULT_COMPANY, DEFAULT_TERMS } = require("../utils/defaults");
const { httpError, validateQuotationPayload } = require("../middleware/validate");

const QUOTATION_RELATIONS = ["items", "terms", "customer"];

function snapshotFromSettings(settings) {
  const source = settings || DEFAULT_COMPANY;
  return {
    companyName: source.companyName,
    address: source.address,
    website: source.website,
    email: source.email,
    phone: source.phone,
    logoPath: source.logoPath || "/assets/careyu-logo.png",
    signatureName: source.signatureName || DEFAULT_COMPANY.signatureName,
    signatureDesignation: source.signatureDesignation || DEFAULT_COMPANY.signatureDesignation,
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
  const settings = await repos().settings.findOne({ where: { id: "default" } });
  return settings || DEFAULT_COMPANY;
}

async function nextQuotationNumber(date = new Date()) {
  const prefix = datePrefix(date);
  const latest = await repos().quotations.findOne({
    where: { quotationNumber: ILike(`${prefix}%`) },
    order: { quotationNumber: "DESC" },
  });
  const sequence = latest ? Number(latest.quotationNumber.split("-")[1] || 0) + 1 : 1;
  return formatQuotationNumber(date, sequence);
}

async function assertUniqueNumber(quotationNumber, excludeId) {
  const existing = await repos().quotations.findOne({ where: { quotationNumber } });
  if (existing && existing.id !== excludeId) {
    throw httpError(409, "Quotation number already exists. Please use a unique number.");
  }
}

function stripRelation(entity, key) {
  if (!entity || typeof entity !== "object") return entity;
  const copy = { ...entity };
  delete copy[key];
  return copy;
}

function serializeQuotation(quotation) {
  if (!quotation) return null;
  const items = [...(quotation.items || [])].sort((a, b) => a.serialNumber - b.serialNumber);
  const totals = calculateQuotation(
    items,
    quotation.freight,
    quotation.installationCharge,
    quotation.gstPercentage,
    quotation.gstAsExtra
  );
  return {
    ...stripRelation(quotation, "createdBy"),
    customer: quotation.customer ? stripRelation(quotation.customer, "quotations") : quotation.customer,
    subtotal: Number(quotation.subtotal),
    freight: Number(quotation.freight),
    installationCharge: Number(quotation.installationCharge),
    gstPercentage: Number(quotation.gstPercentage),
    gstAsExtra: quotation.gstAsExtra !== false,
    gstAmount: Number(quotation.gstAmount),
    grandTotal: Number(quotation.grandTotal),
    totalBasicLanded: totals.totalBasicLanded,
    items: items.map((item) => ({
      ...stripRelation(item, "quotation"),
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      totalAmount: Number(item.totalAmount),
    })),
    terms: quotation.terms ? stripRelation(quotation.terms, "quotation") : quotation.terms,
  };
}

async function loadQuotation(id, manager) {
  return repos(manager).quotations.findOne({
    where: { id },
    relations: QUOTATION_RELATIONS,
  });
}

async function listQuotations(query = {}) {
  const { search, status, client, from, to } = query;
  const qb = repos()
    .quotations.createQueryBuilder("q")
    .leftJoinAndSelect("q.items", "items")
    .leftJoinAndSelect("q.terms", "terms")
    .leftJoinAndSelect("q.customer", "customer")
    .orderBy("q.createdAt", "DESC")
    .addOrderBy("items.serialNumber", "ASC");

  if (status) qb.andWhere("q.status = :status", { status });
  if (client) {
    qb.andWhere("(q.clientCompany ILIKE :client OR q.clientName ILIKE :client)", {
      client: `%${client}%`,
    });
  }
  if (from) qb.andWhere("q.quotationDate >= :from", { from });
  if (to) qb.andWhere("q.quotationDate <= :to", { to });
  if (search) {
    qb.andWhere(
      "(q.quotationNumber ILIKE :search OR q.projectName ILIKE :search OR q.clientName ILIKE :search OR q.clientCompany ILIKE :search)",
      { search: `%${search}%` }
    );
  }

  const rows = await qb.getMany();
  return rows.map(serializeQuotation);
}

async function getQuotation(id) {
  const quotation = await loadQuotation(id);
  if (!quotation) throw httpError(404, "Quotation not found.");
  return serializeQuotation(quotation);
}

async function createQuotation(body, userId) {
  const { errors } = validateQuotationPayload(body, { forGenerate: body.status === "generated" });
  if (errors.length) throw httpError(400, "Validation failed.", errors);

  const settings = await getSettings();
  const quotationNumber = String(body.quotationNumber || "").trim();
  await assertUniqueNumber(quotationNumber);

  const totals = calculateQuotation(
    body.items,
    body.freight,
    body.installationCharge,
    body.gstPercentage,
    body.gstAsExtra
  );

  const id = newId();
  const ds = getDataSource();
  await ds.transaction(async (manager) => {
    await manager.getRepository(Quotation).save({
      id,
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
      pdfPath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (totals.items.length) {
      await manager.getRepository(QuotationItem).save(
        totals.items.map((item) => ({
          id: newId(),
          quotationId: id,
          serialNumber: item.serialNumber,
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalAmount: item.totalAmount,
        }))
      );
    }
    await manager.getRepository(QuotationTerms).save({
      id: newId(),
      quotationId: id,
      ...termsFromBody(body, settings),
    });
  });

  return serializeQuotation(await loadQuotation(id));
}

async function updateQuotation(id, body, { forGenerate = false } = {}) {
  const existing = await loadQuotation(id);
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

  const ds = getDataSource();
  await ds.transaction(async (manager) => {
    await manager.getRepository(QuotationItem).delete({ quotationId: id });
    await manager.getRepository(Quotation).update(id, {
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
      updatedAt: new Date(),
    });
    if (totals.items.length) {
      await manager.getRepository(QuotationItem).save(
        totals.items.map((item) => ({
          id: newId(),
          quotationId: id,
          serialNumber: item.serialNumber,
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalAmount: item.totalAmount,
        }))
      );
    }
    const termsPayload = termsFromBody(payload, null);
    const termsRepo = manager.getRepository(QuotationTerms);
    const existingTerms = await termsRepo.findOne({ where: { quotationId: id } });
    if (existingTerms) {
      await termsRepo.update(existingTerms.id, termsPayload);
    } else {
      await termsRepo.save({ id: newId(), quotationId: id, ...termsPayload });
    }
  });

  return serializeQuotation(await loadQuotation(id));
}

async function deleteQuotation(id) {
  const existing = await repos().quotations.findOne({ where: { id } });
  if (!existing) throw httpError(404, "Quotation not found.");
  await repos().quotations.delete(id);
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
  const quotationRepo = repos().quotations;
  const [total, drafts, generated, monthQuotes, sumRow, recent] = await Promise.all([
    quotationRepo.count(),
    quotationRepo.count({ where: { status: "draft" } }),
    quotationRepo.count({ where: { status: In(["generated", "sent", "approved"]) } }),
    quotationRepo.count({ where: { createdAt: MoreThanOrEqual(monthStart) } }),
    quotationRepo
      .createQueryBuilder("q")
      .select("COALESCE(SUM(q.grandTotal), 0)", "sum")
      .getRawOne(),
    quotationRepo.find({
      order: { createdAt: "DESC" },
      take: 8,
      relations: ["items"],
    }),
  ]);
  return {
    totalQuotations: total,
    draftQuotations: drafts,
    generatedQuotations: generated,
    thisMonthQuotations: monthQuotes,
    totalQuotationValue: Number(sumRow?.sum || 0),
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
  loadQuotation,
};
