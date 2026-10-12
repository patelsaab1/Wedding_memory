import { createErrorResponse } from '@wedding-memory/shared';
import { AppError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';
import { config } from '../config/index.js';

const logger = createLogger({ level: config.logLevel, service: 'api' });

/**
 * Express 404 handler for unmatched routes.
 */
export function notFoundHandler(req, _res, next) {
  next(
    new AppError(`Route not found: ${req.method} ${req.originalUrl}`, {
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
    }),
  );
}

/**
 * Centralized error handler. Controllers should throw AppError or pass errors to next().
 * Never leaks stack traces in production. Never exposes passwordHash or secrets.
 */
export function errorHandler(err, req, res, _next) {
  const isAppError = err instanceof AppError;

  let statusCode = isAppError ? err.statusCode : 500;
  let code = isAppError ? err.code : 'INTERNAL_ERROR';
  let message =
    isAppError && err.isOperational
      ? err.message
      : config.isProduction
        ? 'An unexpected error occurred'
        : err.message || 'An unexpected error occurred';
  let details = isAppError ? err.details : undefined;

  // Mongoose cast / validation helpers
  if (err?.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid identifier';
    details = undefined;
  }

  if (err instanceof SyntaxError || err?.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body must be valid JSON';
    details = undefined;
  }

  if (err?.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  }

  if (err?.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'Resource already exists';
    details = undefined;
  }

  const logMeta = {
    code,
    statusCode,
    requestId: req.requestId,
    stack: config.isProduction ? undefined : err.stack,
  };

  if (statusCode >= 500) {
    logger.error(message, logMeta);
  } else {
    logger.warn(message, logMeta);
  }

  const payload = createErrorResponse(message, code, details);
  if (req.requestId) {
    payload.meta = { requestId: req.requestId };
  }

  res.status(statusCode).json(payload);
}
