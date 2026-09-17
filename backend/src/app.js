const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/assets", express.static(path.join(__dirname, "pdf/assets")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "careyu-quotation-api" });
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
