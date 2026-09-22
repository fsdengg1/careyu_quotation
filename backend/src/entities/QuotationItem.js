const { EntitySchema } = require("typeorm");
const { decimalTransformer } = require("./helpers");

module.exports = new EntitySchema({
  name: "QuotationItem",
  tableName: "quotation_items",
  columns: {
    id: { type: "text", primary: true },
    quotationId: { name: "quotation_id", type: "text" },
    serialNumber: { name: "serial_number", type: "int" },
    description: { type: "text" },
    unitPrice: {
      name: "unit_price",
      type: "decimal",
      precision: 14,
      scale: 2,
      transformer: decimalTransformer,
    },
    quantity: {
      type: "decimal",
      precision: 12,
      scale: 2,
      transformer: decimalTransformer,
    },
    totalAmount: {
      name: "total_amount",
      type: "decimal",
      precision: 14,
      scale: 2,
      transformer: decimalTransformer,
    },
  },
  relations: {
    quotation: {
      type: "many-to-one",
      target: "Quotation",
      joinColumn: { name: "quotation_id" },
      onDelete: "CASCADE",
      inverseSide: "items",
    },
  },
});
