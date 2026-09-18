import { createServer } from "node:http";
import { httpServerHandler } from "cloudflare:node";
import app from "../backend/src/app.js";
import prisma from "../backend/src/models/prisma.js";
import runtimeEnv from "../backend/src/runtime/env.js";

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
    const run = prisma.runWithPrismaContext || ((fn) => fn());
    return run(async () => {
      try {
        return await dispatch(request, workerEnv, ctx);
      } finally {
        if (typeof prisma.disconnectRequestClient === "function") {
          await prisma.disconnectRequestClient();
        }
      }
    });
  },
};
