import { AppError } from '../utils/errors.js';

/**
 * Validate request data with a Zod schema.
 * @param {import('zod').ZodTypeAny} schema
 * @param {'query' | 'params' | 'body'} source
 */
export function validate(schema, source = 'query') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return next(
        new AppError('Validation failed', {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          details,
        }),
      );
    }

    req[source] = parsed.data;
    return next();
  };
}
