import request from 'supertest';
import { AUTH_COOKIES, USER_ROLES } from '@wedding-memory/shared';
import { hashPassword } from '../../src/utils/password.js';
import * as userRepository from '../../src/repositories/user.repository.js';

/**
 * @param {string[] | undefined} setCookie
 * @param {string} name
 */
export function readCookie(setCookie, name) {
  const list = setCookie ?? [];
  const entry = list.find((item) => item.startsWith(`${name}=`));
  if (!entry) {
    return null;
  }
  return decodeURIComponent(entry.split(';')[0].slice(name.length + 1));
}

/**
 * @param {object} [overrides]
 */
export async function seedUser(overrides = {}) {
  const password = overrides.password ?? 'Password123!';
  const passwordHash = await hashPassword(password);

  const user = await userRepository.createUser({
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `user-${Date.now()}@example.com`,
    passwordHash,
    role: overrides.role ?? USER_ROLES.MASTER,
    isActive: overrides.isActive ?? true,
    accessExpiresAt: overrides.accessExpiresAt,
    allowedPermissions: overrides.allowedPermissions,
  });

  return { user, password };
}

/**
 * Login and return a supertest agent with cookies + CSRF token.
 * @param {import('express').Express} app
 * @param {{ email: string, password: string }} credentials
 */
export async function loginAs(app, credentials) {
  const agent = request.agent(app);
  const response = await agent.post('/api/v1/auth/login').send(credentials);

  const csrfToken = readCookie(response.headers['set-cookie'], AUTH_COOKIES.CSRF);

  return {
    agent,
    response,
    csrfToken,
    user: response.body?.data?.user,
  };
}

/**
 * @param {import('supertest').SuperAgentTest} agent
 * @param {string} method
 * @param {string} url
 * @param {string} csrfToken
 */
export function authedRequest(agent, method, url, csrfToken) {
  const req = agent[method](url);
  if (csrfToken && !['get', 'head', 'options'].includes(method)) {
    req.set('X-CSRF-Token', csrfToken);
  }
  return req;
}
