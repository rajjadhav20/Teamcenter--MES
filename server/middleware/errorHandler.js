const multer = require('multer');
const logger = require('../utils/logger');

/**
 * Express 5 forwards thrown/rejected errors from async route handlers to
 * this middleware automatically (no next(err) or asyncHandler wrapper
 * needed at the call sites) — see routes/controllers, which are plain
 * `async (req, res) => {...}` functions. This is the single place that
 * turns any error shape into a consistent JSON response.
 *
 * Must be registered last, and must keep all four arguments (err, req,
 * res, next) — Express identifies error middleware by that arity.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file exceeds the size limit' : err.message;
  } else if (err.name === 'ValidationError') {
    // Mongoose schema validation failure
    statusCode = 400;
    details = Object.values(err.errors || {}).map((e) => e.message);
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
    ...(details ? { details } : {}),
  });
}

module.exports = errorHandler;
