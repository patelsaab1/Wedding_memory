import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { SUPER_ADMIN_EMAIL, USER_ROLES } from '@wedding-memory/shared';
import { createApp } from '../src/app.js';
import { decryptSecret, encryptSecret } from '../src/services/storage/drive-token.store.js';
import { loginAs, seedUser, authedRequest } from './helpers/auth.js';

describe('Google Drive token status', () => {
  const app = createApp();

  it('encrypts and decrypts a Drive refresh token without exposing it', () => {
    const sealed = encryptSecret('refresh-secret-value');
    expect(sealed.ciphertext).not.toContain('refresh-secret-value');
    expect(decryptSecret(sealed)).toBe('refresh-secret-value');
  });

  it('hides Drive status from a family login', async () => {
    const family = await seedUser({
      email: 'drive-family@example.com',
      role: USER_ROLES.FAMILY,
    });
    const { agent } = await loginAs(app, {
      email: family.user.email,
      password: family.password,
    });

    const response = await agent.get('/api/v1/storage/google/status');
    expect(response.status).toBe(403);
  });

  it('lets the super admin read Drive status without secrets', async () => {
    const password = 'Password123!';
    try {
      await seedUser({
        email: SUPER_ADMIN_EMAIL,
        role: USER_ROLES.MASTER,
        name: 'Rohit & Roshni',
        password,
      });
    } catch {
      // Another test file may already have seeded this email.
    }
    const { agent, csrfToken } = await loginAs(app, {
      email: SUPER_ADMIN_EMAIL,
      password,
    });

    const response = await agent.get('/api/v1/storage/google/status');
    expect(response.status).toBe(200);
    expect(response.body.data.accountHint).toBe(SUPER_ADMIN_EMAIL);
    expect(JSON.stringify(response.body)).not.toMatch(/"refreshToken"|"clientSecret"|"ciphertext"/i);

    const refreshed = await authedRequest(agent, 'post', '/api/v1/storage/google/refresh', csrfToken);
    expect(refreshed.status).toBe(200);
    expect(typeof refreshed.body.data.connected).toBe('boolean');
    expect(JSON.stringify(refreshed.body)).not.toMatch(/"refreshToken"|"clientSecret"|"ciphertext"/i);
  });
});
