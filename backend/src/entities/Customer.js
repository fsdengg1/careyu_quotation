const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Customer",
  tableName: "customers",
  columns: {
    id: { type: "text", primary: true },
    customerName: { name: "customer_name", type: "text" },
    companyName: { name: "company_name", type: "text" },
    address: { type: "text", default: "" },
    city: { type: "text", default: "" },
    state: { type: "text", default: "" },
    country: { type: "text", default: "India" },
    gstNumber: { name: "gst_number", type: "text", default: "" },
    contactPerson: { name: "contact_person", type: "text", default: "" },
    email: { type: "text", default: "" },
    phone: { type: "text", default: "" },
    createdAt: { name: "created_at", type: "timestamp", createDate: true },
    updatedAt: { name: "updated_at", type: "timestamp", updateDate: true },
  },
  relations: {
    quotations: {
      type: "one-to-many",
      target: "Quotation",
      inverseSide: "customer",
    },
  },
});
