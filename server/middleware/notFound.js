const AppError = require('../utils/AppError');

// No path pattern here on purpose — Express 5's path-to-regexp no longer
// accepts a bare '*' wildcard, and this only needs to run for whatever
// fell through every route above it anyway.
function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

module.exports = notFound;
