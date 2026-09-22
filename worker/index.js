import { createServer } from "node:http";
import { httpServerHandler } from "cloudflare:node";
import app from "../backend/src/app.js";
import runtimeEnv from "../backend/src/runtime/env.js";
import { initializeDatabase } from "../backend/src/config/database.js";

process.env.CF_WORKER = "1";

const server = createServer(app);
const expressHandler = httpServerHandler(server);

function apply(workerEnv) {
  const applyWorkerEnv = runtimeEnv.applyWorkerEnv || runtimeEnv;
  applyWorkerEnv(workerEnv);
  process.env.CF_WORKER = "1";
  if (workerEnv?.HYPERDRIVE?.connectionString) {
    process.env.DATABASE_URL = workerEnv.HYPERDRIVE.connectionString;
  }
}

function dispatch(request, workerEnv, ctx) {
  if (typeof expressHandler === "function") {
    return expressHandler(request, workerEnv, ctx);
  }
  return expressHandler.fetch(request, workerEnv, ctx);
}

export default {
  async fetch(request, workerEnv, ctx) {
    apply(workerEnv);
    try {
      await initializeDatabase();
      return await dispatch(request, workerEnv, ctx);
    } catch (error) {
      console.error(
        JSON.stringify({
          msg: "worker_fetch_error",
          message: String(error?.message || error),
        })
      );
      return Response.json(
        { message: "Unable to connect right now. Please wait a few seconds and try again." },
        { status: 503, headers: { "Retry-After": "5" } }
      );
    }
  },
};
