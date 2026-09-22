require("dotenv").config();
const bcrypt = require("bcryptjs");
const { initializeDatabase, closeDatabase } = require("../src/config/database");
const { repos } = require("../src/db");
const { newId } = require("../src/entities/helpers");
const { DEFAULT_COMPANY, DEFAULT_TERMS } = require("../src/utils/defaults");

async function main() {
  await initializeDatabase();
  const password = await bcrypt.hash("CareYu@2026", 10);
  const { users, settings, customers } = repos();

  const existingUser = await users.findOne({ where: { email: "admin@careyu.ai" } });
  if (existingUser) {
    await users.update(existingUser.id, { name: "Shradha" });
  } else {
    await users.save({
      id: newId(),
      email: "admin@careyu.ai",
      password,
      name: "Shradha",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const existingSettings = await settings.findOne({ where: { id: "default" } });
  if (!existingSettings) {
    await settings.save({
      id: "default",
      ...DEFAULT_COMPANY,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const existingHero = await customers.findOne({
    where: { companyName: "HERO MOTOCORP PVT LTD." },
  });
  if (!existingHero) {
    await customers.save({
      id: newId(),
      customerName: "HERO MOTOCORP PVT LTD.",
      companyName: "HERO MOTOCORP PVT LTD.",
      address: "Sricity",
      city: "Sricity",
      state: "Andhra Pradesh",
      country: "India",
      contactPerson: "",
      email: "",
      phone: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log("Seed complete.");
  console.log("Login:  admin@careyu.ai");
  console.log("Password: CareYu@2026");
  console.log("Default terms snapshot:", DEFAULT_TERMS.quotationValidity);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await closeDatabase();
  });
