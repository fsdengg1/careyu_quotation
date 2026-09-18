require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 4001;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set.");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`CARE YU quotation API running on http://localhost:${PORT}`);
});


