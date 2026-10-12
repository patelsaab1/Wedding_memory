import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * @param {{ id: string, role: string }} user
 */
export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: 'access',
    },
    config.auth.accessSecret,
    {
      expiresIn: config.auth.accessExpiresIn,
    },
  );
}

/**
 * @param {{ id: string, role: string }} user
 * @param {string} sessionId
 */
export function signRefreshToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      sid: sessionId,
      type: 'refresh',
    },
    config.auth.refreshSecret,
    {
      expiresIn: config.auth.refreshExpiresIn,
    },
  );
}

/**
 * @param {string} token
 */
export function verifyAccessToken(token) {
  const payload = jwt.verify(token, config.auth.accessSecret);
  if (payload.type !== 'access') {
    throw new Error('Invalid access token type');
  }
  return payload;
}

/**
 * @param {string} token
 */
export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, config.auth.refreshSecret);
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }
  return payload;
}

/**
 * Hash opaque/refresh token material for DB storage.
 * @param {string} token
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a CSRF token for double-submit cookie pattern.
 */
export function generateCsrfToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Parse JWT expiry duration into milliseconds (supports s/m/h/d).
 * @param {string} value
 */
export function durationToMs(value) {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    return 15 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
}
