require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { DEFAULT_COMPANY, DEFAULT_TERMS } = require("../src/utils/defaults");

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("CareYu@2026", 10);

  await prisma.user.upsert({
    where: { email: "admin@careyu.ai" },
    update: { name: "Shradha" },
    create: {
      email: "admin@careyu.ai",
      password,
      name: "Shradha",
      role: "admin",
    },
  });

  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      ...DEFAULT_COMPANY,
    },
  });

  const existingHero = await prisma.customer.findFirst({
    where: { companyName: "HERO MOTOCORP PVT LTD." },
  });

  if (!existingHero) {
    await prisma.customer.create({
      data: {
        customerName: "HERO MOTOCORP PVT LTD.",
        companyName: "HERO MOTOCORP PVT LTD.",
        address: "Sricity",
        city: "Sricity",
        state: "Andhra Pradesh",
        country: "India",
        contactPerson: "",
        email: "",
        phone: "",
      },
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
    await prisma.$disconnect();
  });
