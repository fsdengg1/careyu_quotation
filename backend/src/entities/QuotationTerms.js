const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "QuotationTerms",
  tableName: "quotation_terms",
  columns: {
    id: { type: "text", primary: true },
    quotationId: { name: "quotation_id", type: "text", unique: true },
    softwareDevelopment: { name: "software_development", type: "text" },
    quotationValidity: { name: "quotation_validity", type: "text" },
    paymentTerms: { name: "payment_terms", type: "text" },
    warranty: { type: "text" },
    generalTerms: { name: "general_terms", type: "text" },
    jurisdiction: { type: "text" },
    liability: { type: "text" },
    salesTerms: { name: "sales_terms", type: "text" },
    insurance: { type: "text" },
    arbitration: { type: "text" },
    amcNote: { name: "amc_note", type: "text" },
  },
  relations: {
    quotation: {
      type: "one-to-one",
      target: "Quotation",
      joinColumn: { name: "quotation_id" },
      onDelete: "CASCADE",
      inverseSide: "terms",
    },
  },
});
