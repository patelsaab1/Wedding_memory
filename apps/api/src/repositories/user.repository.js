import { User } from '../models/user.model.js';

/**
 * @param {string} email
 * @param {{ includePassword?: boolean }} [options]
 */
export async function findUserByEmail(email, options = {}) {
  const query = User.findOne({ email: email.toLowerCase() });
  if (options.includePassword) {
    query.select('+passwordHash');
  }
  return query.lean();
}

/**
 * @param {string} id
 * @param {{ includePassword?: boolean }} [options]
 */
export async function findUserById(id, options = {}) {
  const query = User.findById(id);
  if (options.includePassword) {
    query.select('+passwordHash');
  }
  return query.lean();
}

/**
 * @param {Record<string, unknown>} data
 */
export async function createUser(data) {
  const user = await User.create(data);
  return user.toJSON();
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} update
 */
export async function updateUserById(id, update) {
  return User.findByIdAndUpdate(id, update, { new: true }).lean();
}

/**
 * Accounts the super admin may hand out. The master panel email is never included.
 * @param {string} superAdminEmail
 */
export async function findManagedUsers(superAdminEmail) {
  return User.find({
    email: { $ne: superAdminEmail },
    role: { $ne: 'master' },
  })
    .sort({ createdAt: -1 })
    .lean();
}
