import { AUTH_COOKIES } from '@wedding-memory/shared';
import { config } from '../config/index.js';
import { durationToMs, generateCsrfToken } from '../utils/tokens.js';

const baseCookieOptions = {
  httpOnly: true,
  secure: config.auth.cookieSecure,
  sameSite: config.auth.cookieSameSite,
  path: '/',
};

/**
 * Attach auth cookies (access, refresh, csrf).
 * @param {import('express').Response} res
 * @param {{ accessToken: string, refreshToken: string }} tokens
 */
export function setAuthCookies(res, tokens) {
  const csrfToken = generateCsrfToken();

  res.cookie(AUTH_COOKIES.ACCESS, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: durationToMs(config.auth.accessExpiresIn),
  });

  res.cookie(AUTH_COOKIES.REFRESH, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: durationToMs(config.auth.refreshExpiresIn),
  });

  // Readable by JS for double-submit CSRF protection on mutating requests
  res.cookie(AUTH_COOKIES.CSRF, csrfToken, {
    httpOnly: false,
    secure: config.auth.cookieSecure,
    sameSite: config.auth.cookieSameSite,
    path: '/',
    maxAge: durationToMs(config.auth.refreshExpiresIn),
  });

  return csrfToken;
}

/**
 * Clear all auth-related cookies.
 * @param {import('express').Response} res
 */
export function clearAuthCookies(res) {
  const clearOptions = {
    httpOnly: true,
    secure: config.auth.cookieSecure,
    sameSite: config.auth.cookieSameSite,
    path: '/',
  };

  res.clearCookie(AUTH_COOKIES.ACCESS, clearOptions);
  res.clearCookie(AUTH_COOKIES.REFRESH, clearOptions);
  res.clearCookie(AUTH_COOKIES.CSRF, {
    ...clearOptions,
    httpOnly: false,
  });
}
