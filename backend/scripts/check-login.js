require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/models/prisma");

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, password: true } });
  console.log("userCount", users.length);
  for (const user of users) {
    const match = await bcrypt.compare("CareYu@2026", user.password);
    console.log({ email: user.email, name: user.name, matchesDefault: match });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
