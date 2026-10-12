import { describe, expect, it } from 'vitest';
import { ALBUM_CATEGORIES, USER_ROLES } from '@wedding-memory/shared';
import { createApp } from '../src/app.js';
import * as albumService from '../src/services/albums/album.service.js';
import { albumCreateSchema } from '../src/validators/common.validators.js';
import { loginAs, seedUser } from './helpers/auth.js';

describe('Albums', () => {
  const app = createApp();

  it('creates an album via service and lists it via API', async () => {
    const master = await seedUser({
      email: 'album-master@example.com',
      role: USER_ROLES.MASTER,
    });
    const { agent } = await loginAs(app, {
      email: master.user.email,
      password: master.password,
    });

    const parsed = albumCreateSchema.parse({
      title: 'Ceremony',
      slug: 'ceremony',
      description: 'Main ceremony album',
      category: ALBUM_CATEGORIES.CEREMONY,
      isPublished: true,
      sortOrder: 1,
    });

    const created = await albumService.createAlbum(parsed);
    expect(created.id).toBeTruthy();
    expect(created.slug).toBe('ceremony');

    const listResponse = await agent.get('/api/v1/albums').query({
      isPublished: 'true',
      page: 1,
      limit: 10,
    });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].slug).toBe('ceremony');
    expect(listResponse.body.meta.total).toBe(1);

    const detailResponse = await agent.get(`/api/v1/albums/${created.id}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.title).toBe('Ceremony');
  });

  it('returns 404 for unknown album id', async () => {
    const master = await seedUser({
      email: 'album-404@example.com',
      role: USER_ROLES.MASTER,
    });
    const { agent } = await loginAs(app, {
      email: master.user.email,
      password: master.password,
    });

    const response = await agent.get('/api/v1/albums/507f1f77bcf86cd799439011');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects invalid album id format', async () => {
    const master = await seedUser({
      email: 'album-invalid@example.com',
      role: USER_ROLES.MASTER,
    });
    const { agent } = await loginAs(app, {
      email: master.user.email,
      password: master.password,
    });

    const response = await agent.get('/api/v1/albums/not-an-id');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid album create payload at validation layer', () => {
    const result = albumCreateSchema.safeParse({
      title: '',
      slug: 'INVALID SLUG',
    });

    expect(result.success).toBe(false);
  });
});
