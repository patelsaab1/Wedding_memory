import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storageProviderError } from './storage.errors.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_DRIVE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../../.env');

/**
 * @param {{ clientId: string, redirectUri: string, state: string, loginHint?: string }} input
 */
export function buildGoogleDriveAuthUrl({ clientId, redirectUri, state, loginHint }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_DRIVE_OAUTH_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  if (loginHint) {
    params.set('login_hint', loginHint);
  }

  return `${AUTH_URL}?${params.toString()}`;
}

/**
 * @param {object} input
 * @param {string} input.code
 * @param {string} input.clientId
 * @param {string} input.clientSecret
 * @param {string} input.redirectUri
 * @param {typeof fetch} [input.fetchImpl]
 */
export async function exchangeGoogleDriveCode({
  code,
  clientId,
  clientSecret,
  redirectUri,
  fetchImpl = fetch,
}) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const reason =
      typeof payload.error_description === 'string'
        ? payload.error_description
        : typeof payload.error === 'string'
          ? payload.error
          : 'token exchange failed';
    throw storageProviderError('google_drive', `Google did not return a token: ${reason}`);
  }

  return {
    accessToken: typeof payload.access_token === 'string' ? payload.access_token : '',
    refreshToken: typeof payload.refresh_token === 'string' ? payload.refresh_token : '',
    expiresIn: Number(payload.expires_in) || null,
    scope: typeof payload.scope === 'string' ? payload.scope : '',
  };
}

/**
 * Write only the refresh token line in apps/api/.env.
 * @param {string} refreshToken
 */
export function saveGoogleDriveRefreshToken(refreshToken) {
  if (!fs.existsSync(envPath)) {
    return false;
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  const line = `GOOGLE_DRIVE_REFRESH_TOKEN=${formatEnvValue(refreshToken)}`;
  const next = /^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m.test(raw)
    ? raw.replace(/^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m, line)
    : `${raw.trimEnd()}\n${line}\n`;
  fs.writeFileSync(envPath, next, 'utf8');
  return true;
}

/**
 * @param {string} value
 */
function formatEnvValue(value) {
  if (/[\s#"'\\]/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}
