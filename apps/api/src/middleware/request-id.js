import { randomUUID } from 'node:crypto';

/**
 * Attach a request ID for correlation in logs and responses.
 */
export function requestIdMiddleware(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const requestId =
    typeof incoming === 'string' && incoming.trim().length > 0 ? incoming.trim() : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
