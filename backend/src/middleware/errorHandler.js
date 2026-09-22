const { isConnectionError } = require("../config/database");

function isDbBusy(err) {
  const message = String(err?.message || "");
  return (
    isConnectionError(err) ||
    /too many database connections/i.test(message) ||
    /remaining connection slots/i.test(message) ||
    /connection terminated/i.test(message)
  );
}

function errorHandler(err, req, res, next) {
  const busy = isDbBusy(err);
  const status = busy ? 503 : err.status || err.statusCode || 500;
  console.error(
    JSON.stringify({
      msg: "api_error",
      status,
      code: err.code,
      requestId: err.requestId,
      message: err.message,
      path: req.originalUrl,
    })
  );
  if (res.headersSent) return next(err);
  if (err.retryAfter || busy) {
    res.setHeader("Retry-After", String(err.retryAfter || 5));
  }
  const loginPath = String(req.originalUrl || "").includes("/auth/login");
  res.status(status).json({
    error: busy ? "DB_BUSY" : err.code || undefined,
    message: busy
      ? loginPath
        ? "Unable to sign in right now. Please wait a few seconds and try again."
        : "Unable to connect right now. Please wait a few seconds and try again."
      : err.message || "Something went wrong. Please try again.",
    requestId: err.requestId || undefined,
    details: busy ? undefined : err.details || undefined,
  });
}

function notFound(req, res) {
  res.status(404).json({ message: "That page or item could not be found." });
}

module.exports = { errorHandler, notFound };
