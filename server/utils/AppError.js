/**
 * An error we threw on purpose (bad input, not-found, etc.) as opposed to
 * a bug. The error handler uses `isOperational` to decide whether to leak
 * the message to the client or mask it as a generic 500.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
