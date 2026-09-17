const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../models/prisma");
const { httpError } = require("../middleware/validate");

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) throw httpError(400, "Email and password are required.");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw httpError(401, "Invalid email or password.");
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw httpError(401, "Invalid email or password.");

    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, me };
