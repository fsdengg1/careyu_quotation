const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { getWorkerEnv, getSecret } = require("../runtime/env");

let prisma;
let pool;

function isWorkerRuntime() {
  return process.env.CF_WORKER === "1" || Boolean(getWorkerEnv());
}

function resolveConnectionString() {
  const workerEnv = getWorkerEnv();
  const hyperdriveUrl = workerEnv?.HYPERDRIVE?.connectionString;
  const connectionString = hyperdriveUrl || getSecret("DATABASE_URL");
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  return { connectionString, hyperdrive: Boolean(hyperdriveUrl) };
}

function createAdapter() {
  const { connectionString, hyperdrive } = resolveConnectionString();
  const worker = isWorkerRuntime();
  const sslRequired =
    !hyperdrive && /sslmode=(require|verify-ca|verify-full|no-verify)/i.test(connectionString);
  const cleaned = hyperdrive
    ? connectionString
    : connectionString
        .replace(/([?&])sslmode=[^&]*/gi, "$1")
        .replace(/[?&]$/, "")
        .replace(/\?&/, "?");

  pool = new Pool({
    connectionString: cleaned,
    max: worker ? 1 : 2,
    min: 0,
    idleTimeoutMillis: worker ? 5000 : 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
    ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
  });
  pool.on("error", (err) => {
    console.error(JSON.stringify({ msg: "pg_pool_error", message: err.message }));
  });
  return new PrismaPg(pool);
}

function createPrismaClient() {
  return new PrismaClient({ adapter: createAdapter() });
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
