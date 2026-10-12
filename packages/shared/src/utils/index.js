/**
 * Create a consistent API success payload.
 * @param {unknown} data
 * @param {Record<string, unknown>} [meta]
 */
/** The only account that may open the master panel. */
export const SUPER_ADMIN_EMAIL = 'rohitroshnipatel@gmail.com';

/**
 * @param {{ email?: string } | null | undefined} user
 */
export function isSuperAdmin(user) {
  return String(user?.email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function createSuccessResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta,
  };
}

/**
 * Create a consistent API error payload.
 * @param {string} message
 * @param {string} [code]
 * @param {unknown} [details]
 */
export function createErrorResponse(message, code = 'INTERNAL_ERROR', details = undefined) {
  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    payload.error.details = details;
  }

  return payload;
}

/**
 * Build pagination meta for list endpoints.
 * @param {{ page: number, limit: number, total: number }} input
 */
export function createPaginationMeta({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Convert a Mongoose document / lean object into a plain JSON-safe record.
 * Strips sensitive fields when present.
 * @param {Record<string, unknown> | null | undefined} doc
 * @param {string[]} [omitFields]
 */
export function toPublicJson(doc, omitFields = ['passwordHash', '__v']) {
  if (!doc) {
    return null;
  }

  const raw = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const result = { ...raw };

  if (result._id !== undefined && result.id === undefined) {
    result.id = String(result._id);
  }

  delete result._id;

  for (const field of omitFields) {
    delete result[field];
  }

  return result;
}
