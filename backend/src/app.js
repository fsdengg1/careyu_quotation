const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

const isWorker = process.env.CF_WORKER === "1";
const isProduction = process.env.NODE_ENV === "production" || isWorker;
const frontendUrl = process.env.FRONTEND_URL;

if (!isProduction) {
  app.use(
    cors({
      origin: frontendUrl || "http://localhost:5173",
      credentials: true,
    })
  );
} else if (frontendUrl) {
  app.use(
    cors({
      origin: frontendUrl,
      credentials: true,
    })
  );
}

app.use(express.json({ limit: "2mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

if (process.env.NODE_ENV !== "production" && process.env.CF_WORKER !== "1") {
  try {
    app.use("/assets", express.static(path.join(__dirname, "pdf/assets")));
  } catch {
    // Workers have no filesystem assets directory.
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "careyu-quotation" });
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
