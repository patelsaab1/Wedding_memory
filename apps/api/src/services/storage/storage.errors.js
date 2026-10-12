import { AppError } from '../../utils/errors.js';

/**
 * @param {string} provider
 * @param {string[]} [missing]
 */
export function storageNotConfiguredError(provider, missing = []) {
  const missingText =
    missing.length > 0 ? ` Missing: ${missing.join(', ')}.` : '';
  return new AppError(
    `Storage provider "${provider}" is not configured.${missingText} Set the required server-side environment variables (never expose them to the frontend).`,
    {
      statusCode: 503,
      code: 'STORAGE_NOT_CONFIGURED',
      details: { provider, missing },
    },
  );
}

/**
 * @param {unknown} provider
 */
export function storageInvalidProviderError(provider) {
  return new AppError(`Invalid storage provider: ${String(provider)}`, {
    statusCode: 400,
    code: 'STORAGE_INVALID_PROVIDER',
    details: { provider },
  });
}

/**
 * @param {string} provider
 * @param {string} [message]
 */
export function storageProviderError(provider, message = 'Storage provider request failed') {
  return new AppError(message, {
    statusCode: 502,
    code: 'STORAGE_PROVIDER_ERROR',
    details: { provider },
  });
}

export function storageOperationUnavailableError(provider, operation) {
  return new AppError(
    `Storage provider "${provider}" cannot perform "${operation}" yet. Provider credentials/SDK wiring is not active.`,
    {
      statusCode: 501,
      code: 'STORAGE_OPERATION_UNAVAILABLE',
      details: { provider, operation },
    },
  );
}
