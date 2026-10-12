import { describe, expect, it } from 'vitest';
import { MEDIA_TYPES, STORAGE_PROVIDERS, USER_ROLES, VISIBILITY } from '@wedding-memory/shared';
import { createApp } from '../src/app.js';
import * as mediaService from '../src/services/media/media.service.js';
import * as albumService from '../src/services/albums/album.service.js';
import { loginAs, seedUser } from './helpers/auth.js';

describe('Media', () => {
  const app = createApp();

  it('paginates media list results', async () => {
    const master = await seedUser({
      email: 'media-master@example.com',
      role: USER_ROLES.MASTER,
    });
    const { agent } = await loginAs(app, {
      email: master.user.email,
      password: master.password,
    });

    const album = await albumService.createAlbum({
      title: 'Reception',
      slug: 'reception',
      isPublished: true,
    });

    for (let i = 1; i <= 5; i += 1) {
      await mediaService.createMedia({
        title: `Photo ${i}`,
        provider: STORAGE_PROVIDERS.R2,
        providerFileId: `file-${i}`,
        storageKey: `wedding/photo-${i}.jpg`,
        albumId: album.id,
        mediaType: MEDIA_TYPES.IMAGE,
        mimeType: 'image/jpeg',
        fileName: `photo-${i}.jpg`,
        fileSize: 1024 * i,
        visibility: VISIBILITY.FAMILY,
      });
    }

    const page1 = await agent.get('/api/v1/media').query({
      page: 1,
      limit: 2,
      albumId: album.id,
    });

    expect(page1.status).toBe(200);
    expect(page1.body.success).toBe(true);
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.meta.total).toBe(5);
    expect(page1.body.meta.totalPages).toBe(3);
    expect(page1.body.meta.hasNext).toBe(true);
    expect(page1.body.meta.hasPrev).toBe(false);

    const page2 = await agent.get('/api/v1/media').query({
      page: 2,
      limit: 2,
      albumId: album.id,
    });

    expect(page2.status).toBe(200);
    expect(page2.body.data).toHaveLength(2);
    expect(page2.body.meta.hasPrev).toBe(true);
    expect(page2.body.meta.hasNext).toBe(true);

    const page3 = await agent.get('/api/v1/media').query({
      page: 3,
      limit: 2,
      albumId: album.id,
    });

    expect(page3.body.data).toHaveLength(1);
    expect(page3.body.meta.hasNext).toBe(false);
  });

  it('returns media by id', async () => {
    const master = await seedUser({
      email: 'media-detail@example.com',
      role: USER_ROLES.MASTER,
    });
    const { agent } = await loginAs(app, {
      email: master.user.email,
      password: master.password,
    });

    const media = await mediaService.createMedia({
      title: 'First dance',
      provider: STORAGE_PROVIDERS.GOOGLE_DRIVE,
      providerFileId: 'drive-file-1',
      mediaType: MEDIA_TYPES.VIDEO,
      mimeType: 'video/mp4',
      fileName: 'first-dance.mp4',
      fileSize: 5_000_000,
    });

    const response = await agent.get(`/api/v1/media/${media.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('First dance');
    expect(response.body.data.provider).toBe('google_drive');
  });

  it('rejects invalid media query params', async () => {
    const master = await seedUser({
      email: 'media-validation@example.com',
      role: USER_ROLES.MASTER,
    });
    const { agent } = await loginAs(app, {
      email: master.user.email,
      password: master.password,
    });

    const response = await agent.get('/api/v1/media').query({
      page: 0,
      limit: 9999,
      mediaType: 'gif',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(response.body.error.details)).toBe(true);
  });

  it('rejects invalid media id', async () => {
    const master = await seedUser({
      email: 'media-bad-id@example.com',
      role: USER_ROLES.MASTER,
    });
    const { agent } = await loginAs(app, {
      email: master.user.email,
      password: master.password,
    });

    const response = await agent.get('/api/v1/media/abc');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
