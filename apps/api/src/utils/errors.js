export class AppError extends Error {
  /**
   * @param {string} message
   * @param {object} [options]
   * @param {number} [options.statusCode]
   * @param {string} [options.code]
   * @param {boolean} [options.isOperational]
   * @param {unknown} [options.details]
   */
  constructor(message, options = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? 'INTERNAL_ERROR';
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export function unauthorizedError(message = 'Authentication required') {
  return new AppError(message, {
    statusCode: 401,
    code: 'UNAUTHORIZED',
  });
}

export function forbiddenError(message = 'Insufficient permissions') {
  return new AppError(message, {
    statusCode: 403,
    code: 'FORBIDDEN',
  });
}

export function notFoundError(message = 'Resource not found') {
  return new AppError(message, {
    statusCode: 404,
    code: 'NOT_FOUND',
  });
}

export function badRequestError(message = 'Bad request', details) {
  return new AppError(message, {
    statusCode: 400,
    code: 'BAD_REQUEST',
    details,
  });
}
