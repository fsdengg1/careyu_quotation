function isDbBusy(err) {
  const message = String(err?.message || "");
  return (
    err?.code === "P2037" ||
    err?.code === "53300" ||
    /too many database connections/i.test(message) ||
    /remaining connection slots/i.test(message)
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
  res.status(status).json({
    error: busy ? "DB_BUSY" : err.code || undefined,
    message: busy
      ? "The database is busy. Wait a few seconds and try signing in again."
      : err.message || "Internal server error.",
    requestId: err.requestId || undefined,
    details: busy ? undefined : err.details || undefined,
  });
}

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
