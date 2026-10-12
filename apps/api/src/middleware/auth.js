import { AUTH_COOKIES, hasPermission, hasPermissions, hasRole, isSuperAdmin } from '@wedding-memory/shared';
import * as userRepository from '../repositories/user.repository.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { forbiddenError, unauthorizedError } from '../utils/errors.js';
import { loginStillOpen, mapPublicUser } from '../services/auth/auth.service.js';
import { asyncHandler } from '../utils/async-handler.js';

async function optionalAuthHandler(req, _res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIES.ACCESS];
    if (!token) {
      req.user = null;
      return next();
    }

    const payload = verifyAccessToken(token);
    const user = await userRepository.findUserById(payload.sub);
    if (!loginStillOpen(user)) {
      req.user = null;
      return next();
    }

    req.user = mapPublicUser(user);
    return next();
  } catch {
    req.user = null;
    return next();
  }
}

async function requireAuthHandler(req, _res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIES.ACCESS];
    if (!token) {
      return next(unauthorizedError('Authentication required'));
    }

    const payload = verifyAccessToken(token);
    const user = await userRepository.findUserById(payload.sub);

    if (!loginStillOpen(user)) {
      return next(unauthorizedError(user?.isActive ? 'This login has ended' : 'Authentication required'));
    }

    req.user = mapPublicUser(user);
    return next();
  } catch {
    return next(unauthorizedError('Invalid or expired authentication'));
  }
}

export const optionalAuth = asyncHandler(optionalAuthHandler);
export const requireAuth = asyncHandler(requireAuthHandler);

/**
 * Require one of the given roles.
 * @param {...string} roles
 */
export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(unauthorizedError('Authentication required'));
    }

    if (!hasRole(req.user, ...roles)) {
      return next(forbiddenError('Insufficient role'));
    }

    return next();
  };
}

/**
 * Require a single permission.
 * @param {string} permission
 */
export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(unauthorizedError('Authentication required'));
    }

    if (!hasPermission(req.user, permission)) {
      return next(forbiddenError('Insufficient permissions'));
    }

    return next();
  };
}

/**
 * Require multiple permissions.
 * @param {string[]} permissions
 * @param {'all' | 'any'} [mode]
 */
export function requirePermissions(permissions, mode = 'all') {
  return (req, _res, next) => {
    if (!req.user) {
      return next(unauthorizedError('Authentication required'));
    }

    if (!hasPermissions(req.user, permissions, mode)) {
      return next(forbiddenError('Insufficient permissions'));
    }

    return next();
  };
}

/**
 * Master panel is limited to one email, even if another account has the master role.
 */
export function requireSuperAdmin(req, _res, next) {
  if (!req.user) {
    return next(unauthorizedError('Authentication required'));
  }

  if (!isSuperAdmin(req.user)) {
    return next(forbiddenError('The master panel is limited to the super admin account'));
  }

  return next();
}

/**
 * CSRF double-submit check for mutating requests when auth cookies are used.
 */
export function csrfProtection(req, _res, next) {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // Login bootstraps the CSRF cookie — skip check for this endpoint only
  if (req.originalUrl.includes('/auth/login')) {
    return next();
  }

  const cookieToken = req.cookies?.[AUTH_COOKIES.CSRF];
  const headerToken = req.get('x-csrf-token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(forbiddenError('Invalid CSRF token'));
  }

  return next();
}
