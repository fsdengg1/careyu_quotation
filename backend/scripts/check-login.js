require("dotenv").config();
const bcrypt = require("bcryptjs");
const { initializeDatabase, closeDatabase } = require("../src/config/database");
const { repos } = require("../src/db");

async function main() {
  await initializeDatabase();
  const users = await repos().users.find({
    select: { id: true, email: true, name: true, password: true },
  });
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
    await closeDatabase();
  });
