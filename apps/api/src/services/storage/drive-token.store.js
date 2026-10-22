import crypto from 'node:crypto';
import { STORAGE_PROVIDERS, SUPER_ADMIN_EMAIL } from '@wedding-memory/shared';
import { config } from '../../config/index.js';
import { DriveCredential } from '../../models/drive-credential.model.js';
import { getStorageManager } from './storage.service.js';

const PROVIDER = STORAGE_PROVIDERS.GOOGLE_DRIVE;

function encryptionKey() {
  return crypto.createHash('sha256').update(config.auth.accessSecret).digest();
}

/**
 * @param {string} plain
 */
export function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

/**
 * @param {{ ciphertext: string, iv: string, tag: string }} sealed
 */
export function decryptSecret(sealed) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(sealed.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(sealed.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/**
 * @param {string} refreshToken
 */
export function applyDriveRefreshToken(refreshToken) {
  const provider = getStorageManager().getProvider(PROVIDER);
  if (typeof provider.setRefreshToken === 'function') {
    provider.setRefreshToken(refreshToken);
  }
}

export async function loadStoredDriveRefreshToken() {
  const row = await DriveCredential.findOne({ provider: PROVIDER }).lean();
  if (!row?.ciphertext || !row.iv || !row.tag) return '';
  try {
    return decryptSecret(row);
  } catch {
    return '';
  }
}

/**
 * @param {string} refreshToken
 * @param {string} [updatedByEmail]
 */
export async function persistDriveRefreshToken(refreshToken, updatedByEmail) {
  const sealed = encryptSecret(refreshToken);
  await DriveCredential.findOneAndUpdate(
    { provider: PROVIDER },
    {
      ...sealed,
      updatedByEmail: updatedByEmail || SUPER_ADMIN_EMAIL,
      lastError: null,
      lastCheckedAt: new Date(),
    },
    { upsert: true, new: true },
  );
  applyDriveRefreshToken(refreshToken);
}

export async function hydrateDriveTokenFromStore() {
  const stored = await loadStoredDriveRefreshToken();
  if (stored) applyDriveRefreshToken(stored);
  return Boolean(stored || config.storage.googleDrive.refreshToken);
}

async function markDriveCheck({ ok, message }) {
  await DriveCredential.updateOne(
    { provider: PROVIDER },
    {
      $set: {
        lastCheckedAt: new Date(),
        lastError: ok ? null : String(message || 'Google Drive is not connected').slice(0, 240),
      },
    },
  ).catch(() => {});
}

function publicDriveMessage(error) {
  const code = error?.code;
  if (code === 'STORAGE_NOT_CONFIGURED') {
    return 'Drive is not fully configured on the server yet.';
  }
  if (code === 'STORAGE_PROVIDER_ERROR') {
    return 'Google Drive authorization failed. Update the token from Status.';
  }
  return 'Google Drive could not be reached. Update the token from Status.';
}

export async function getDriveTokenPublicStatus() {
  const row = await DriveCredential.findOne({ provider: PROVIDER }).lean();
  const provider = getStorageManager().getProvider(PROVIDER);
  const configStatus = provider.getConfigStatus();
  return {
    hasClient: Boolean(config.storage.googleDrive.clientId && config.storage.googleDrive.clientSecret),
    hasRefreshToken: Boolean(configStatus.configured || row?.ciphertext),
    connected: false,
    needsUpdate: !configStatus.configured || Boolean(row?.lastError),
    accountHint: SUPER_ADMIN_EMAIL,
    updatedAt: row?.updatedAt ?? null,
    lastCheckedAt: row?.lastCheckedAt ?? null,
    lastError: row?.lastError ?? configStatus.message ?? null,
  };
}

export async function probeDriveConnection() {
  const provider = getStorageManager().getProvider(PROVIDER);
  const configStatus = provider.getConfigStatus();

  if (!configStatus.configured) {
    const needsUpdate = configStatus.missing.includes('refreshToken');
    const message = needsUpdate
      ? 'Drive token is missing. Update the token from Status.'
      : 'Drive client credentials are missing on the server.';
    await markDriveCheck({ ok: false, message });
    return { connected: false, needsUpdate, message };
  }

  try {
    await provider.listFiles({ pageSize: 1 });
    await markDriveCheck({ ok: true });
    return { connected: true, needsUpdate: false, message: 'Google Drive is connected.' };
  } catch (error) {
    const message = publicDriveMessage(error);
    const needsUpdate = error?.code === 'STORAGE_PROVIDER_ERROR';
    await markDriveCheck({ ok: false, message });
    return { connected: false, needsUpdate, message };
  }
}
