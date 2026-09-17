const prisma = require("../models/prisma");
const { httpError, validateCustomer } = require("../middleware/validate");

async function list(req, res, next) {
  try {
    const search = String(req.query.search || "").trim();
    const where = search
      ? {
          OR: [
            { customerName: { contains: search, mode: "insensitive" } },
            { companyName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { companyName: "asc" },
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
    const customer = await prisma.customer.create({
      data: {
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
      },
    });
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!existing) throw httpError(404, "Customer not found.");
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
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
      },
    });
    res.json(customer);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!existing) throw httpError(404, "Customer not found.");
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update, remove };
