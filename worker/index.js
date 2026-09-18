import { createServer } from "node:http";
import { httpServerHandler } from "cloudflare:node";
import { env } from "cloudflare:workers";
import app from "../backend/src/app.js";
import runtimeEnv from "../backend/src/runtime/env.js";

function apply(workerEnv = env) {
  const applyWorkerEnv = runtimeEnv.applyWorkerEnv || runtimeEnv;
  applyWorkerEnv(workerEnv);
  process.env.CF_WORKER = "1";
  if (workerEnv?.HYPERDRIVE?.connectionString) {
    process.env.DATABASE_URL = workerEnv.HYPERDRIVE.connectionString;
  }
}

apply(env);

const server = createServer(app);
const expressHandler = httpServerHandler(server);

function dispatch(request, workerEnv, ctx) {
  if (typeof expressHandler === "function") {
    return expressHandler(request, workerEnv, ctx);
  }
  return expressHandler.fetch(request, workerEnv, ctx);
}

export default {
  async fetch(request, workerEnv, ctx) {
    apply(workerEnv);
    return dispatch(request, workerEnv, ctx);
  },
};
