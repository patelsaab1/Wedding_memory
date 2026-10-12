import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

/**
 * Hash a password with bcrypt (cost factor from config).
 * @param {string} password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, config.auth.bcryptRounds);
}

/**
 * Compare plain password against stored hash.
 * @param {string} password
 * @param {string} passwordHash
 */
export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
