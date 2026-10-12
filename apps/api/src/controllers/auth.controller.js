import { createSuccessResponse } from '@wedding-memory/shared';
import * as authService from '../services/auth/auth.service.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';
import { AUTH_COOKIES } from '@wedding-memory/shared';

function clientMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent') || undefined,
    requestId: req.requestId,
  };
}

export async function login(req, res) {
  const result = await authService.login({
    email: req.body.email,
    password: req.body.password,
    ...clientMeta(req),
  });

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  res.status(200).json(
    createSuccessResponse({
      user: result.user,
    }),
  );
}

export async function logout(req, res) {
  await authService.logout({
    refreshToken: req.cookies?.[AUTH_COOKIES.REFRESH],
    userId: req.user?.id,
    role: req.user?.role,
    requestId: req.requestId,
  });

  clearAuthCookies(res);
  res.status(200).json(createSuccessResponse({ loggedOut: true }));
}

export async function refresh(req, res) {
  const result = await authService.refresh({
    refreshToken: req.cookies?.[AUTH_COOKIES.REFRESH],
    ...clientMeta(req),
  });

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  res.status(200).json(
    createSuccessResponse({
      user: result.user,
    }),
  );
}

export async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json(createSuccessResponse(user));
}
