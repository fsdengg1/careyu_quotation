function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
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
  if (err.retryAfter) {
    res.setHeader("Retry-After", String(err.retryAfter));
  }
  res.status(status).json({
    error: err.code || undefined,
    message: err.message || "Internal server error.",
    requestId: err.requestId || undefined,
    details: err.details || undefined,
  });
}

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
