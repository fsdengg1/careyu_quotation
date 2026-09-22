const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { repos } = require("../db");
const { httpError } = require("../middleware/validate");
const { getSecret } = require("../runtime/env");

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getSecret("JWT_SECRET"),
    { expiresIn: getSecret("JWT_EXPIRES_IN", "7d") }
  );
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) throw httpError(400, "Email and password are required.");

    const user = await repos().users.findOne({ where: { email } });
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
