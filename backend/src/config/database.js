require("reflect-metadata");
const { DataSource } = require("typeorm");
const { getWorkerEnv, getSecret } = require("../runtime/env");
const { entities } = require("../entities");

let dataSource;
let initializing;

function isWorkerRuntime() {
  return process.env.CF_WORKER === "1" || Boolean(getWorkerEnv());
}

function isConnectionError(err) {
  const message = String(err?.message || err?.cause?.message || "");
  const code = String(err?.code || err?.cause?.code || "");
  return (
    ["53300", "57P01", "ECONNRESET", "ETIMEDOUT", "EPIPE", "08006", "08001", "08003"].includes(code) ||
    /too many database connections/i.test(message) ||
    /remaining connection slots/i.test(message) ||
    /connection terminated/i.test(message) ||
    /server closed the connection/i.test(message) ||
    /timeout expired/i.test(message) ||
    /can't reach database/i.test(message)
  );
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

function createDataSource() {
  const { connectionString, hyperdrive } = resolveConnectionString();
  const worker = isWorkerRuntime();
  const sslRequired =
    !hyperdrive && /sslmode=(require|verify-ca|verify-full|no-verify)/i.test(connectionString);
  const url = hyperdrive
    ? connectionString
    : connectionString
        .replace(/([?&])sslmode=[^&]*/gi, "$1")
        .replace(/[?&]$/, "")
        .replace(/\?&/, "?");

  return new DataSource({
    type: "postgres",
    url,
    ssl: sslRequired ? { rejectUnauthorized: false } : false,
    extra: {
      max: worker ? 1 : 2,
      min: 0,
      idleTimeoutMillis: worker ? 4000 : 10000,
      connectionTimeoutMillis: 8000,
      allowExitOnIdle: true,
      ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
    },
    entities,
    migrations: ["src/migrations/*.js"],
    synchronize: false,
    migrationsRun: false,
    logging: false,
  });
}

async function initializeDatabase() {
  if (dataSource?.isInitialized) return dataSource;
  if (initializing) return initializing;
  initializing = (async () => {
    dataSource = createDataSource();
    await dataSource.initialize();
    return dataSource;
  })().finally(() => {
    initializing = null;
  });
  return initializing;
}

function getDataSource() {
  if (!dataSource?.isInitialized) {
    throw new Error("Database is not initialized.");
  }
  return dataSource;
}

async function closeDatabase() {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  dataSource = null;
}

module.exports = {
  createDataSource,
  initializeDatabase,
  getDataSource,
  closeDatabase,
  isConnectionError,
};
