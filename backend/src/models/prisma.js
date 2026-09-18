const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { getWorkerEnv, getSecret } = require("../runtime/env");

let prisma;

function createAdapter(connectionString, { hyperdrive = false } = {}) {
  if (hyperdrive) {
    return new PrismaPg({ connectionString });
  }

  const sslRequired = /sslmode=(require|verify-ca|verify-full|no-verify)/i.test(connectionString);
  const cleaned = connectionString
    .replace(/([?&])sslmode=[^&]*/gi, "$1")
    .replace(/[?&]$/, "")
    .replace(/\?&/, "?");

  const pool = new Pool({
    connectionString: cleaned,
    max: 5,
    ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
  });
  return new PrismaPg(pool);
}

function createPrismaClient() {
  const workerEnv = getWorkerEnv();
  const hyperdriveUrl = workerEnv?.HYPERDRIVE?.connectionString;
  const connectionString = hyperdriveUrl || getSecret("DATABASE_URL");
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  const adapter = createAdapter(connectionString, { hyperdrive: Boolean(hyperdriveUrl) });
  return new PrismaClient({ adapter });
}

function getPrisma() {
  if (!prisma) prisma = createPrismaClient();
  return prisma;
}

module.exports = new Proxy(
  { createPrismaClient },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === "__esModule") return false;
      if (prop === "then") return undefined;
      const client = getPrisma();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);
