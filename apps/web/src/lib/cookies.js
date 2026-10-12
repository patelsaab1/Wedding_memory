import { AUTH_COOKIES } from '@wedding-memory/shared';

/**
 * Read a browser cookie by name (used for CSRF double-submit only).
 * Auth tokens are HTTP-only and are never readable here.
 * @param {string} name
 */
export function getCookie(name) {
  if (typeof document === 'undefined') {
    return null;
  }

  const encoded = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!encoded) {
    return null;
  }

  return decodeURIComponent(encoded.slice(name.length + 1));
}

export function getCsrfToken() {
  return getCookie(AUTH_COOKIES.CSRF);
}
