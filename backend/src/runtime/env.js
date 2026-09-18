function getWorkerEnv() {
  return globalThis.__WORKER_ENV || null;
}

function getSecret(name, fallback) {
  const workerEnv = getWorkerEnv();
  if (workerEnv && workerEnv[name] != null && typeof workerEnv[name] !== "object") {
    return String(workerEnv[name]);
  }
  if (process.env[name] != null) return process.env[name];
  return fallback;
}

function applyWorkerEnv(env) {
  globalThis.__WORKER_ENV = env || null;
  if (!env) return;
  const keys = ["JWT_SECRET", "JWT_EXPIRES_IN", "DATABASE_URL", "FRONTEND_URL"];
  for (const key of keys) {
    if (env[key] != null) process.env[key] = String(env[key]);
  }
}

function isCloudflareWorker() {
  return Boolean(getWorkerEnv());
}

module.exports = { getWorkerEnv, getSecret, applyWorkerEnv, isCloudflareWorker };
module.exports.applyWorkerEnv = applyWorkerEnv;
module.exports.getWorkerEnv = getWorkerEnv;
module.exports.getSecret = getSecret;
module.exports.isCloudflareWorker = isCloudflareWorker;
