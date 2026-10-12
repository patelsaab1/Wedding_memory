import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { PERMISSIONS, USER_ROLES } from '@wedding-memory/shared';
import { createApp } from '../src/app.js';
import { loginAs, seedUser, authedRequest } from './helpers/auth.js';
import * as albumService from '../src/services/albums/album.service.js';

describe('Auth + RBAC', () => {
  const app = createApp();

  it('logs in successfully and returns current user', async () => {
    const { password, user } = await seedUser({
      email: 'master@example.com',
      role: USER_ROLES.MASTER,
    });

    const { response, agent, csrfToken } = await loginAs(app, {
      email: user.email,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('master@example.com');
    expect(response.body.data.user.permissions).toContain(PERMISSIONS.USERS_MANAGE);
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    expect(response.headers['set-cookie']).toBeTruthy();

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.id).toBe(user.id);

    const logout = await authedRequest(agent, 'post', '/api/v1/auth/logout', csrfToken);
    expect(logout.status).toBe(200);
  });

  it('rejects invalid credentials with a generic message', async () => {
    await seedUser({
      email: 'wife@example.com',
      role: USER_ROLES.WIFE,
      password: 'Password123!',
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'wife@example.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('rejects inactive accounts', async () => {
    const { password, user } = await seedUser({
      email: 'inactive@example.com',
      role: USER_ROLES.FAMILY,
      isActive: false,
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password,
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('blocks unauthorized access to protected APIs', async () => {
    const response = await request(app).get('/api/v1/albums');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('enforces role/permission restrictions', async () => {
    const viewer = await seedUser({
      email: 'viewer@example.com',
      role: USER_ROLES.VIEWER,
    });

    const { agent } = await loginAs(app, {
      email: viewer.user.email,
      password: viewer.password,
    });

    const albums = await agent.get('/api/v1/albums');
    expect(albums.status).toBe(403);
    expect(albums.body.error.code).toBe('FORBIDDEN');

    const media = await agent.get('/api/v1/media');
    expect(media.status).toBe(200);
  });

  it('rejects invalid/expired access without a valid cookie', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', 'wm_access=not-a-valid-token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('allows family to view albums when permitted', async () => {
    const family = await seedUser({
      email: 'family@example.com',
      role: USER_ROLES.FAMILY,
    });

    await albumService.createAlbum({
      title: 'Family Album',
      slug: 'family-album',
      isPublished: true,
    });

    const { agent } = await loginAs(app, {
      email: family.user.email,
      password: family.password,
    });

    const response = await agent.get('/api/v1/albums');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('rotates refresh tokens', async () => {
    const master = await seedUser({
      email: 'refresh@example.com',
      role: USER_ROLES.MASTER,
    });

    const {
      agent,
      csrfToken,
      response: loginResponse,
    } = await loginAs(app, {
      email: master.user.email,
      password: master.password,
    });

    expect(loginResponse.status).toBe(200);

    const refreshed = await authedRequest(agent, 'post', '/api/v1/auth/refresh', csrfToken);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.user.email).toBe('refresh@example.com');
  });
});
