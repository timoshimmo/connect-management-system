const { AppError } = require('../common/errors');
const logger = require('../utils/logger');

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err instanceof AppError ? err.statusCode : err.name === 'ValidationError' ? 400 : 500;

  if (statusCode >= 500) {
    logger.error({ err }, 'unhandled error');
  }

  res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : err.message,
  });
}

module.exports = { notFound, errorHandler };
