const { ILike } = require("typeorm");
const { repos } = require("../db");
const { newId } = require("../entities/helpers");
const { httpError, validateCustomer } = require("../middleware/validate");

async function list(req, res, next) {
  try {
    const search = String(req.query.search || "").trim();
    const where = search
      ? [
          { customerName: ILike(`%${search}%`) },
          { companyName: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { phone: ILike(`%${search}%`) },
        ]
      : {};
    const customers = await repos().customers.find({
      where,
      order: { companyName: "ASC" },
    });
    res.json(customers);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const errors = validateCustomer(req.body);
    if (errors.length) throw httpError(400, "Validation failed.", errors);
    const customer = await repos().customers.save({
      id: newId(),
      customerName: String(req.body.customerName || req.body.companyName || "").trim(),
      companyName: String(req.body.companyName || req.body.customerName || "").trim(),
      address: req.body.address || "",
      city: req.body.city || "",
      state: req.body.state || "",
      country: req.body.country || "India",
      gstNumber: req.body.gstNumber || "",
      contactPerson: req.body.contactPerson || "",
      email: req.body.email || "",
      phone: req.body.phone || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const existing = await repos().customers.findOne({ where: { id: req.params.id } });
    if (!existing) throw httpError(404, "Customer not found.");
    await repos().customers.update(req.params.id, {
      customerName: req.body.customerName ?? existing.customerName,
      companyName: req.body.companyName ?? existing.companyName,
      address: req.body.address ?? existing.address,
      city: req.body.city ?? existing.city,
      state: req.body.state ?? existing.state,
      country: req.body.country ?? existing.country,
      gstNumber: req.body.gstNumber ?? existing.gstNumber,
      contactPerson: req.body.contactPerson ?? existing.contactPerson,
      email: req.body.email ?? existing.email,
      phone: req.body.phone ?? existing.phone,
      updatedAt: new Date(),
    });
    const customer = await repos().customers.findOne({ where: { id: req.params.id } });
    res.json(customer);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await repos().customers.findOne({ where: { id: req.params.id } });
    if (!existing) throw httpError(404, "Customer not found.");
    await repos().customers.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update, remove };
