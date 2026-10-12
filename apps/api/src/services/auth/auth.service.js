import { resolvePermissions, toPublicJson, USER_ROLES } from '@wedding-memory/shared';
import { config } from '../../config/index.js';
import * as userRepository from '../../repositories/user.repository.js';
import * as refreshSessionRepository from '../../repositories/refresh-session.repository.js';
import { verifyPassword } from '../../utils/password.js';
import {
  durationToMs,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/tokens.js';
import { createLogger } from '../../utils/logger.js';
import { forbiddenError, unauthorizedError } from '../../utils/errors.js';
import mongoose from 'mongoose';

const logger = createLogger({ level: config.logLevel, service: 'auth' });

const GENERIC_LOGIN_FAILURE = 'Invalid email or password';

function mapPublicUser(user) {
  const publicUser = toPublicJson(user, ['passwordHash', '__v']);
  return {
    ...publicUser,
    permissions: resolvePermissions(user),
  };
}

/**
 * A guest login can be turned off early, or it ends on its own after the chosen date.
 * @param {{ isActive?: boolean, accessExpiresAt?: Date | string | null } | null | undefined} user
 */
export function loginStillOpen(user) {
  if (!user?.isActive) return false;
  if (!user.accessExpiresAt) return true;
  return new Date(user.accessExpiresAt).getTime() > Date.now();
}

function audit(event, meta = {}) {
  logger.info(`auth.audit.${event}`, meta);
}

/**
 * @param {{ email: string, password: string, ip?: string, userAgent?: string, requestId?: string }} input
 */
export async function login(input) {
  const user = await userRepository.findUserByEmail(input.email, {
    includePassword: true,
  });

  if (!user || !user.passwordHash) {
    audit('login_failure', {
      email: input.email,
      reason: 'unknown_user',
      ip: input.ip,
      requestId: input.requestId,
    });
    throw unauthorizedError(GENERIC_LOGIN_FAILURE);
  }

  if (!loginStillOpen(user)) {
    audit('login_failure', {
      userId: String(user._id),
      role: user.role,
      reason: user.isActive ? 'access_ended' : 'inactive',
      ip: input.ip,
      requestId: input.requestId,
    });
    throw forbiddenError(user.isActive ? 'This login has ended' : 'Account is inactive');
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  if (!passwordValid) {
    audit('login_failure', {
      userId: String(user._id),
      role: user.role,
      reason: 'bad_password',
      ip: input.ip,
      requestId: input.requestId,
    });
    throw unauthorizedError(GENERIC_LOGIN_FAILURE);
  }

  const tokens = await issueTokenPair(user, {
    ip: input.ip,
    userAgent: input.userAgent,
  });

  await userRepository.updateUserById(String(user._id), {
    lastLoginAt: new Date(),
  });

  if (user.role === USER_ROLES.MASTER || user.role === USER_ROLES.WIFE) {
    audit('login_success_admin', {
      userId: String(user._id),
      role: user.role,
      ip: input.ip,
      requestId: input.requestId,
    });
  } else {
    audit('login_success', {
      userId: String(user._id),
      role: user.role,
      ip: input.ip,
      requestId: input.requestId,
    });
  }

  return {
    user: mapPublicUser(user),
    ...tokens,
  };
}

/**
 * @param {Record<string, unknown>} user
 * @param {{ ip?: string, userAgent?: string }} meta
 */
async function issueTokenPair(user, meta = {}) {
  const userId = String(user._id ?? user.id);
  const sessionId = new mongoose.Types.ObjectId();
  const publicUser = { id: userId, role: user.role };

  const refreshToken = signRefreshToken(publicUser, String(sessionId));
  const accessToken = signAccessToken(publicUser);
  const tokenHash = hashToken(refreshToken);

  await refreshSessionRepository.createRefreshSession({
    _id: sessionId,
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + durationToMs(config.auth.refreshExpiresIn)),
    userAgent: meta.userAgent ?? null,
    ip: meta.ip ?? null,
  });

  return { accessToken, refreshToken };
}

/**
 * Rotate refresh token and issue a new access token.
 * @param {{ refreshToken: string, ip?: string, userAgent?: string, requestId?: string }} input
 */
export async function refresh(input) {
  if (!input.refreshToken) {
    throw unauthorizedError('Authentication required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    throw unauthorizedError('Invalid or expired session');
  }

  const tokenHash = hashToken(input.refreshToken);
  const session = await refreshSessionRepository.findRefreshSessionByHash(tokenHash);

  if (!session) {
    audit('refresh_failure', {
      reason: 'unknown_session',
      userId: payload.sub,
      requestId: input.requestId,
    });
    throw unauthorizedError('Invalid or expired session');
  }

  if (session.revokedAt) {
    // Possible token reuse — revoke all sessions for this user
    await refreshSessionRepository.revokeAllSessionsForUser(session.userId);
    audit('refresh_reuse_detected', {
      userId: String(session.userId),
      requestId: input.requestId,
    });
    throw unauthorizedError('Invalid or expired session');
  }

  if (session.expiresAt.getTime() < Date.now()) {
    throw unauthorizedError('Invalid or expired session');
  }

  const user = await userRepository.findUserById(String(session.userId));
  if (!loginStillOpen(user)) {
    throw unauthorizedError('This login has ended');
  }

  const newTokens = await issueTokenPair(user, {
    ip: input.ip,
    userAgent: input.userAgent,
  });

  await refreshSessionRepository.updateRefreshSessionById(String(session._id), {
    revokedAt: new Date(),
    replacedByHash: hashToken(newTokens.refreshToken),
  });

  return {
    user: mapPublicUser(user),
    ...newTokens,
  };
}

/**
 * @param {{ refreshToken?: string, userId?: string, requestId?: string, role?: string }} input
 */
export async function logout(input) {
  if (input.refreshToken) {
    const tokenHash = hashToken(input.refreshToken);
    await refreshSessionRepository.revokeSessionByHash(tokenHash);
  }

  if (input.role === USER_ROLES.MASTER || input.role === USER_ROLES.WIFE) {
    audit('logout_admin', {
      userId: input.userId,
      role: input.role,
      requestId: input.requestId,
    });
  } else if (input.userId) {
    audit('logout', {
      userId: input.userId,
      role: input.role,
      requestId: input.requestId,
    });
  }

  return { success: true };
}

/**
 * @param {string} userId
 */
export async function getCurrentUser(userId) {
  const user = await userRepository.findUserById(userId);
  if (!loginStillOpen(user)) {
    throw unauthorizedError('This login has ended');
  }
  return mapPublicUser(user);
}

export { mapPublicUser };
