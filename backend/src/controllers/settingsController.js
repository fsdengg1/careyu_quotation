const prisma = require("../models/prisma");
const { DEFAULT_COMPANY } = require("../utils/defaults");
const { httpError } = require("../middleware/validate");

async function get(req, res, next) {
  try {
    const settings = await prisma.companySettings.findUnique({ where: { id: "default" } });
    res.json(
      settings
        ? { ...settings, defaultGst: Number(settings.defaultGst) }
        : { ...DEFAULT_COMPANY, id: "default" }
    );
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const current = await prisma.companySettings.findUnique({ where: { id: "default" } });
    if (!current) throw httpError(404, "Company settings not found. Run database seed.");
    const settings = await prisma.companySettings.update({
      where: { id: "default" },
      data: {
        companyName: req.body.companyName ?? current.companyName,
        address: req.body.address ?? current.address,
        website: req.body.website ?? current.website,
        email: req.body.email ?? current.email,
        phone: req.body.phone ?? current.phone,
        logoPath: req.body.logoPath ?? current.logoPath,
        defaultGst: req.body.defaultGst ?? current.defaultGst,
        defaultQuotationValidity: req.body.defaultQuotationValidity ?? current.defaultQuotationValidity,
        defaultPaymentTerms: req.body.defaultPaymentTerms ?? current.defaultPaymentTerms,
        defaultWarranty: req.body.defaultWarranty ?? current.defaultWarranty,
        defaultAmcNote: req.body.defaultAmcNote ?? current.defaultAmcNote,
        defaultSoftwareDevelopment:
          req.body.defaultSoftwareDevelopment ?? current.defaultSoftwareDevelopment,
        signatureName: req.body.signatureName ?? current.signatureName,
        signatureDesignation: req.body.signatureDesignation ?? current.signatureDesignation,
        footerTagline: req.body.footerTagline ?? current.footerTagline,
      },
    });
    res.json({ ...settings, defaultGst: Number(settings.defaultGst) });
  } catch (error) {
    next(error);
  }
}

module.exports = { get, update };
