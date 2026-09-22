const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: { type: "text", primary: true },
    email: { type: "text", unique: true },
    password: { type: "text" },
    name: { type: "text" },
    role: { type: "text", default: "admin" },
    createdAt: { name: "created_at", type: "timestamp", createDate: true },
    updatedAt: { name: "updated_at", type: "timestamp", updateDate: true },
  },
  relations: {
    quotations: {
      type: "one-to-many",
      target: "Quotation",
      inverseSide: "createdBy",
    },
  },
});
