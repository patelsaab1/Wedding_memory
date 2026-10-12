import { randomBytes } from 'node:crypto';
import { config } from '../config/index.js';
import { notFoundError } from '../utils/errors.js';
import { storageNotConfiguredError } from '../services/storage/storage.errors.js';
import {
  buildGoogleDriveAuthUrl,
  exchangeGoogleDriveCode,
  saveGoogleDriveRefreshToken,
} from '../services/storage/google-oauth.js';

const STATE_COOKIE = 'wm_gdrive_oauth_state';

/**
 * @param {import('express').Request} req
 */
function redirectUriFor(req) {
  return `${req.protocol}://${req.get('host')}/api/v1/storage/google/callback`;
}

/**
 * @param {string} value
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} title
 * @param {string} body
 */
function htmlPage(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
}

/**
 * Opens Google consent, then on return exchanges the code for a refresh token.
 */
export async function googleDriveCallback(req, res, next) {
  try {
    if (config.isProduction) {
      throw notFoundError();
    }

    const { clientId, clientSecret } = config.storage.googleDrive;
    if (!clientId || !clientSecret) {
      throw storageNotConfiguredError('google_drive', ['clientId', 'clientSecret']);
    }

    const redirectUri = redirectUriFor(req);
    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';

    if (oauthError) {
      const description =
        typeof req.query.error_description === 'string' ? req.query.error_description : oauthError;
      res
        .status(400)
        .type('html')
        .send(
          htmlPage(
            'Google Drive connection was cancelled',
            `<p>${escapeHtml(description)}</p><p><a href="${escapeHtml(redirectUri)}">Try again</a></p>`,
          ),
        );
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';

    if (!code) {
      const state = randomBytes(24).toString('hex');
      res.cookie(STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 10 * 60 * 1000,
        path: '/api/v1/storage/google',
      });
      res.redirect(buildGoogleDriveAuthUrl({ clientId, redirectUri, state }));
      return;
    }

    const expectedState = req.cookies?.[STATE_COOKIE];
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!expectedState || expectedState !== state) {
      res
        .status(400)
        .type('html')
        .send(
          htmlPage(
            'Google sign-in could not be verified',
            `<p>Open the callback link again so a new sign-in can start.</p><p><a href="${escapeHtml(redirectUri)}">Start again</a></p>`,
          ),
        );
      return;
    }

    const tokens = await exchangeGoogleDriveCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    res.clearCookie(STATE_COOKIE, { path: '/api/v1/storage/google' });

    if (!tokens.refreshToken) {
      res
        .status(502)
        .type('html')
        .send(
          htmlPage(
            'Google did not return a refresh token',
            '<p>Remove Wedding Memory access at <a href="https://myaccount.google.com/permissions">Google Account permissions</a>, then open the callback link again.</p>',
          ),
        );
      return;
    }

    saveGoogleDriveRefreshToken(tokens.refreshToken);

    res
      .status(200)
      .type('html')
      .send(
        htmlPage(
          'Google Drive connected',
          `<p>Refresh token saved in <code>apps/api/.env</code> as <code>GOOGLE_DRIVE_REFRESH_TOKEN</code>.</p><p>Access token received. It expires in ${escapeHtml(String(tokens.expiresIn ?? 'unknown'))} seconds.</p><p>Restart the API so the gallery can read the Photos folder.</p><pre>${escapeHtml(tokens.refreshToken)}</pre>`,
        ),
      );
  } catch (error) {
    next(error);
  }
}
