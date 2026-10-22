import { randomBytes } from 'node:crypto';
import { createSuccessResponse, SUPER_ADMIN_EMAIL } from '@wedding-memory/shared';
import { config } from '../config/index.js';
import { storageNotConfiguredError } from '../services/storage/storage.errors.js';
import {
  buildGoogleDriveAuthUrl,
  exchangeGoogleDriveCode,
  saveGoogleDriveRefreshToken,
} from '../services/storage/google-oauth.js';
import {
  getDriveTokenPublicStatus,
  persistDriveRefreshToken,
  probeDriveConnection,
} from '../services/storage/drive-token.store.js';

const STATE_COOKIE = 'wm_gdrive_oauth_state';

/**
 * @param {import('express').Request} req
 */
function redirectUriFor(req) {
  if (config.storage.googleDrive.redirectUri) {
    return config.storage.googleDrive.redirectUri;
  }
  return `${req.protocol}://${req.get('host')}/api/v1/storage/google/callback`;
}

/**
 * @param {import('express').Request} req
 */
function appOrigin(req) {
  if (config.isProduction) {
    return `${req.protocol}://${req.get('host')}`;
  }
  return config.corsOrigin[0] || 'http://localhost:5173';
}

function statusPath(query) {
  return `/status?${new URLSearchParams(query).toString()}`;
}

/**
 * Super admin: current Drive token status. Never returns secrets.
 */
export async function googleDriveStatus(_req, res, next) {
  try {
    const status = await getDriveTokenPublicStatus();
    const probe = status.hasRefreshToken
      ? await probeDriveConnection()
      : { connected: false, needsUpdate: true, message: status.lastError || 'Drive token is missing. Update the token from Status.' };
    res.json(
      createSuccessResponse({
        ...status,
        connected: probe.connected,
        needsUpdate: probe.needsUpdate,
        message: probe.message || status.lastError,
      }),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Super admin: try the stored refresh token. If it is missing or revoked, say so.
 */
export async function googleDriveRefresh(req, res, next) {
  try {
    const result = await probeDriveConnection();
    res.json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

/**
 * Super admin: open Google as the house Drive account and ask for a new refresh token.
 */
export async function googleDriveConnect(req, res, next) {
  try {
    const { clientId, clientSecret } = config.storage.googleDrive;
    if (!clientId || !clientSecret) {
      throw storageNotConfiguredError('google_drive', ['clientId', 'clientSecret']);
    }

    const redirectUri = redirectUriFor(req);
    const state = randomBytes(24).toString('hex');
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.auth.cookieSecure,
      maxAge: 10 * 60 * 1000,
      path: '/api/v1/storage/google',
    });
    res.redirect(
      buildGoogleDriveAuthUrl({
        clientId,
        redirectUri,
        state,
        loginHint: SUPER_ADMIN_EMAIL,
      }),
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Google returns here. Save the refresh token on the server and send the master back to Status.
 */
export async function googleDriveCallback(req, res, next) {
  try {
    const origin = appOrigin(req);
    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';

    if (oauthError) {
      res.redirect(`${origin}${statusPath({ drive: 'failed' })}`);
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) {
      res.redirect(`${origin}${statusPath({ drive: 'failed' })}`);
      return;
    }

    const expectedState = req.cookies?.[STATE_COOKIE];
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!expectedState || expectedState !== state) {
      res.redirect(`${origin}${statusPath({ drive: 'failed' })}`);
      return;
    }

    const { clientId, clientSecret } = config.storage.googleDrive;
    if (!clientId || !clientSecret) {
      throw storageNotConfiguredError('google_drive', ['clientId', 'clientSecret']);
    }

    const tokens = await exchangeGoogleDriveCode({
      code,
      clientId,
      clientSecret,
      redirectUri: redirectUriFor(req),
    });

    res.clearCookie(STATE_COOKIE, { path: '/api/v1/storage/google' });

    if (!tokens.refreshToken) {
      res.redirect(`${origin}${statusPath({ drive: 'failed' })}`);
      return;
    }

    await persistDriveRefreshToken(tokens.refreshToken, req.user?.email || SUPER_ADMIN_EMAIL);
    try {
      saveGoogleDriveRefreshToken(tokens.refreshToken);
    } catch {
      // Live hosts have no writable apps/api/.env. Mongo is the source of truth.
    }

    res.redirect(`${origin}${statusPath({ drive: 'connected' })}`);
  } catch (error) {
    next(error);
  }
}
