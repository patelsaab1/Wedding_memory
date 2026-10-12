/**
 * Reset/create a master user password for local development.
 * Usage: node apps/api/src/scripts/seed-master.js
 * Set SEED_RESET=true to update password if user already exists.
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { User } from '../models/user.model.js';
import { SUPER_ADMIN_EMAIL, USER_ROLES } from '@wedding-memory/shared';
import { createLogger } from '../utils/logger.js';
import { config } from '../config/index.js';

const logger = createLogger({ level: config.logLevel, service: 'seed' });

/**
 * The master panel is locked to one email. Create that account when it is missing.
 * @param {string} passwordHash
 */
async function ensureSuperAdmin(passwordHash) {
  const email = SUPER_ADMIN_EMAIL;
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== USER_ROLES.MASTER || !existing.isActive) {
      existing.role = USER_ROLES.MASTER;
      existing.isActive = true;
      await existing.save();
    }
    logger.info('Super admin account ready', { email });
    return;
  }

  await User.create({
    name: 'Rohit & Roshni',
    email,
    passwordHash,
    role: USER_ROLES.MASTER,
    isActive: true,
  });
  logger.info('Super admin account created', { email });
}

async function main() {
  const email = (process.env.SEED_EMAIL || 'rohit@patel.com').toLowerCase();
  const password = process.env.SEED_PASSWORD || 'Rohit123!';
  const name = process.env.SEED_NAME || 'Rohit Admin';
  const shouldReset = process.env.SEED_RESET === 'true' || process.env.SEED_RESET === '1';

  await connectDatabase();

  const existing = await User.findOne({ email });
  const passwordHash = await hashPassword(password);

  if (existing) {
    if (!shouldReset) {
      logger.info('Master user already exists (set SEED_RESET=true to update password)', {
        email,
      });
      await ensureSuperAdmin(passwordHash);
      await disconnectDatabase();
      return;
    }

    existing.passwordHash = passwordHash;
    existing.name = name;
    existing.isActive = true;
    existing.role = USER_ROLES.MASTER;
    await existing.save();
    logger.info('Master user password reset', { email, role: USER_ROLES.MASTER });
    await ensureSuperAdmin(passwordHash);
    await disconnectDatabase();
    return;
  }

  await User.create({
    name,
    email,
    passwordHash,
    role: USER_ROLES.MASTER,
    isActive: true,
  });

  logger.info('Master user created', { email, role: USER_ROLES.MASTER });
  await ensureSuperAdmin(passwordHash);
  await disconnectDatabase();
}

main().catch(async (error) => {
  logger.error('Seed failed', {
    message: error instanceof Error ? error.message : String(error),
  });
  try {
    await disconnectDatabase();
  } catch {
    // ignore
  }
  process.exit(1);
});
