import { randomInt } from 'node:crypto';
import { SUPER_ADMIN_EMAIL, USER_ROLES } from '@wedding-memory/shared';
import { badRequestError, notFoundError } from '../../utils/errors.js';
import { hashPassword } from '../../utils/password.js';
import * as userRepository from '../../repositories/user.repository.js';

const GUEST_ROLES = new Set([USER_ROLES.FAMILY, USER_ROLES.VIEWER]);
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function guestPassword() {
  let body = '';
  for (let index = 0; index < 8; index += 1) {
    body += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  }
  return `WM-${body}`;
}

/**
 * @param {{ isActive?: boolean, accessExpiresAt?: Date | string | null }} user
 */
function guestStatus(user) {
  if (!user.isActive) return 'ended';
  if (!user.accessExpiresAt) return 'active';
  return new Date(user.accessExpiresAt).getTime() > Date.now() ? 'active' : 'ended';
}

/**
 * @param {Record<string, unknown>} user
 */
function mapGuest(user) {
  const id = user.id ? String(user.id) : String(user._id);
  return {
    id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive !== false,
    accessExpiresAt: user.accessExpiresAt ? new Date(user.accessExpiresAt).toISOString() : null,
    status: guestStatus(user),
  };
}

export async function listGuestLogins() {
  const users = await userRepository.findManagedUsers(SUPER_ADMIN_EMAIL);
  return users.map(mapGuest);
}

/**
 * @param {{ name: string, email: string, role: string, activeDays: number }} input
 */
export async function createGuestLogin(input) {
  const email = input.email.trim().toLowerCase();
  const role = input.role;

  if (email === SUPER_ADMIN_EMAIL) {
    throw badRequestError('That email already owns the master panel');
  }
  if (!GUEST_ROLES.has(role)) {
    throw badRequestError('Choose family or viewer');
  }

  const days = input.activeDays;
  const accessExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const password = guestPassword();
  const passwordHash = await hashPassword(password);
  const existing = await userRepository.findUserByEmail(email);

  if (existing?.role === USER_ROLES.MASTER) {
    throw badRequestError('A master account cannot be turned into a guest login');
  }

  let saved;
  if (existing) {
    saved = await userRepository.updateUserById(String(existing._id), {
      name: input.name.trim(),
      role,
      passwordHash,
      isActive: true,
      accessExpiresAt,
    });
  } else {
    saved = await userRepository.createUser({
      name: input.name.trim(),
      email,
      role,
      passwordHash,
      isActive: true,
      accessExpiresAt,
    });
  }

  return {
    ...mapGuest(saved),
    password,
  };
}

/**
 * @param {string} userId
 */
export async function endGuestLogin(userId) {
  const existing = await userRepository.findUserById(userId);
  if (!existing || existing.email === SUPER_ADMIN_EMAIL || existing.role === USER_ROLES.MASTER) {
    throw notFoundError('That login was not found');
  }

  const saved = await userRepository.updateUserById(userId, { isActive: false });
  return mapGuest(saved);
}
