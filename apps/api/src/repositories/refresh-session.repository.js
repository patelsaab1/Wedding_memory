import { RefreshSession } from '../models/refresh-session.model.js';

/**
 * @param {Record<string, unknown>} data
 */
export async function createRefreshSession(data) {
  return RefreshSession.create(data);
}

/**
 * @param {string} tokenHash
 */
export async function findRefreshSessionByHash(tokenHash) {
  return RefreshSession.findOne({ tokenHash }).lean();
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} update
 */
export async function updateRefreshSessionById(id, update) {
  return RefreshSession.findByIdAndUpdate(id, update, { new: true }).lean();
}

/**
 * @param {string} userId
 */
export async function revokeAllSessionsForUser(userId) {
  return RefreshSession.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

/**
 * @param {string} tokenHash
 */
export async function revokeSessionByHash(tokenHash) {
  return RefreshSession.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true },
  ).lean();
}
