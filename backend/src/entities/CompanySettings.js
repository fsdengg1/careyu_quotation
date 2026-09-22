const { EntitySchema } = require("typeorm");
const { decimalTransformer } = require("./helpers");

module.exports = new EntitySchema({
  name: "CompanySettings",
  tableName: "company_settings",
  columns: {
    id: { type: "text", primary: true, default: "default" },
    companyName: { name: "company_name", type: "text" },
    address: { type: "text" },
    website: { type: "text" },
    email: { type: "text" },
    phone: { type: "text" },
    logoPath: { name: "logo_path", type: "text", default: "/assets/careyu-logo.png" },
    defaultGst: {
      name: "default_gst",
      type: "decimal",
      precision: 5,
      scale: 2,
      transformer: decimalTransformer,
    },
    defaultQuotationValidity: { name: "default_quotation_validity", type: "text" },
    defaultPaymentTerms: { name: "default_payment_terms", type: "text" },
    defaultWarranty: { name: "default_warranty", type: "text" },
    defaultAmcNote: { name: "default_amc_note", type: "text" },
    defaultSoftwareDevelopment: { name: "default_software_development", type: "text" },
    signatureName: { name: "signature_name", type: "text" },
    signatureDesignation: { name: "signature_designation", type: "text" },
    footerTagline: { name: "footer_tagline", type: "text" },
    createdAt: { name: "created_at", type: "timestamp", createDate: true },
    updatedAt: { name: "updated_at", type: "timestamp", updateDate: true },
  },
});
