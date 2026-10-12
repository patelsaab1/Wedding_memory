import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { USER_ROLES } from '@wedding-memory/shared';
import { createApp } from '../src/app.js';
import {
  galleryRoleForFolder,
  partitionGalleryFolders,
} from '../src/services/gallery/gallery-catalog.js';
import { getWeddingGallery, openGalleryFile } from '../src/services/gallery/gallery.service.js';
import { loginAs, seedUser } from './helpers/auth.js';
import { badRequestError, forbiddenError } from '../src/utils/errors.js';

function photo(id, name, parentId) {
  return {
    id,
    name,
    mimeType: 'image/jpeg',
    isFolder: false,
    parentId,
    provider: 'google_drive',
    providerFileId: id,
    storageKey: null,
    size: 10,
    createdAt: null,
    updatedAt: null,
  };
}

function folder(id, name) {
  return {
    id,
    name,
    provider: 'google_drive',
    providerFileId: id,
    parentId: 'photos-root',
    createdAt: null,
    updatedAt: null,
  };
}

describe('wedding gallery catalog', () => {
  it('maps Haldi, top featured, and slider folders', () => {
    expect(galleryRoleForFolder('Haldi')).toBe('haldi');
    expect(galleryRoleForFolder('topFetured')).toBe('featured');
    expect(galleryRoleForFolder('Slider')).toBe('slider');
    expect(galleryRoleForFolder('CoupleShoot')).toBe('couple');
    expect(galleryRoleForFolder('video')).toBe('trailer');
    expect(galleryRoleForFolder('Sadhi_Event_Photos')).toBe('album');
  });

  it('splits the Photos folder into website sections', () => {
    const grouped = partitionGalleryFolders([
      folder('h1', 'Haldi'),
      folder('f1', 'topFetured'),
      folder('s1', 'Slider'),
      folder('a1', 'Sadhi_Event_Photos'),
      folder('a2', 'RohitRoshni'),
      folder('v1', 'video'),
    ]);

    expect(grouped.haldi.title).toBe('Haldi');
    expect(grouped.featured.title).toBe('Top Featured');
    expect(grouped.slider.title).toBe('Slider');
    expect(grouped.trailer.title).toBe('Wedding treasure');
    expect(grouped.albums.map((album) => album.title)).toEqual([
      'RohitRoshni',
      'Sadhi Event Photos',
    ]);
  });
});

describe('wedding gallery service', () => {
  it('builds slider, featured, haldi, and album covers from storage', async () => {
    const folders = [
      folder('haldi', 'Haldi'),
      folder('featured', 'topFetured'),
      folder('slider', 'Slider'),
      folder('sadhi', 'Sadhi_Event_Photos'),
    ];
    const images = {
      haldi: [photo('p1', 'haldi-1.jpg', 'haldi')],
      featured: [photo('p2', 'featured-1.jpg', 'featured')],
      slider: [photo('p3', 'slide-1.jpg', 'slider')],
      sadhi: [photo('p4', 'sadhi-1.jpg', 'sadhi')],
    };

    const storage = {
      getConfiguredProvider() {
        return {};
      },
      async listFolders() {
        return { items: folders, nextPageToken: null };
      },
      async listFiles({ folderId }) {
        return { items: images[folderId] ?? [], nextPageToken: null };
      },
    };

    const gallery = await getWeddingGallery({
      storage,
      rootFolderId: 'photos-root',
      coupleName: 'Rohit & Roshni',
    });

    expect(gallery.ready).toBe(true);
    expect(gallery.slider.map((item) => item.id)).toEqual(['p3']);
    expect(gallery.featured[0].previewPath).toBe('/api/v1/gallery/files/p2/content?size=preview');
    expect(gallery.featured[0].fullPath).toBe('/api/v1/gallery/files/p2/content');
    expect(gallery.haldi.photos).toHaveLength(1);
    expect(gallery.albums[0]).toMatchObject({
      id: 'sadhi',
      title: 'Sadhi Event Photos',
      cover: { id: 'p4' },
    });
    expect(gallery.couple).toEqual([]);
    expect(JSON.stringify(gallery)).not.toMatch(/client_secret|refresh_token|access_token/i);
  });

  it('reads CoupleShoot from inside RohitRoshni', async () => {
    const storage = {
      getConfiguredProvider() {
        return {};
      },
      async listFolders({ parentId }) {
        if (parentId === 'rohit') {
          return { items: [folder('couple', 'CoupleShoot')], nextPageToken: null };
        }
        return { items: [folder('rohit', 'RohitRoshni')], nextPageToken: null };
      },
      async listFiles({ folderId }) {
        if (folderId === 'couple') {
          return { items: [photo('us', 'together.jpg', 'couple')], nextPageToken: null };
        }
        return { items: [], nextPageToken: null };
      },
    };

    const gallery = await getWeddingGallery({
      storage,
      rootFolderId: 'photos-root',
      coupleName: 'Rohit & Roshni',
    });

    expect(gallery.couple.map((item) => item.id)).toEqual(['us']);
    expect(gallery.coupleFolderId).toBe('couple');
    expect(gallery.coupleParentId).toBe('rohit');
    expect(gallery.albums.map((album) => album.title)).toEqual(['Couple shoot', 'RohitRoshni']);
    expect(gallery.albums[0]).toMatchObject({ id: 'couple', parentId: 'rohit', cover: { id: 'us' } });
  });

  it('keeps a film in featured frames and hides it when video access is off', async () => {
    const storage = {
      getConfiguredProvider() {
        return {};
      },
      async listFolders() {
        return { items: [folder('featured', 'topFetured')], nextPageToken: null };
      },
      async listFiles() {
        return {
          items: [
            {
              ...photo('clip', 'vows.mp4', 'featured'),
              mimeType: 'video/mp4',
            },
            photo('still', 'portrait.jpg', 'featured'),
          ],
          nextPageToken: null,
        };
      },
    };

    const gallery = await getWeddingGallery({
      storage,
      rootFolderId: 'photos-root',
      coupleName: 'Rohit & Roshni',
    });
    const hidden = await getWeddingGallery({
      storage,
      rootFolderId: 'photos-root',
      coupleName: 'Rohit & Roshni',
      includeVideos: false,
    });

    expect(gallery.featured.map((item) => item.kind)).toEqual(['video', 'image']);
    expect(gallery.featured[0].previewPath).toBe('/api/v1/gallery/files/clip/content');
    expect(gallery.featured[1].previewPath).toBe('/api/v1/gallery/files/still/content?size=preview');
    expect(hidden.featured.map((item) => item.id)).toEqual(['still']);
  });

  it('lifts the video folder into the wedding treasure trailer', async () => {
    const storage = {
      getConfiguredProvider() {
        return {};
      },
      async listFolders() {
        return {
          items: [folder('films', 'video'), folder('sadhi', 'Sadhi_Event_Photos')],
          nextPageToken: null,
        };
      },
      async listFiles({ folderId }) {
        if (folderId === 'films') {
          return {
            items: [{ ...photo('clip', 'intro.mp4', 'films'), mimeType: 'video/mp4' }],
            nextPageToken: null,
          };
        }
        return { items: [], nextPageToken: null };
      },
    };

    const gallery = await getWeddingGallery({
      storage,
      rootFolderId: 'photos-root',
      coupleName: 'Rohit & Roshni',
    });

    expect(gallery.trailer).toMatchObject({
      id: 'films',
      title: 'Wedding treasure',
      video: { id: 'clip', kind: 'video' },
    });
    expect(gallery.albums.map((album) => album.id)).toEqual(['sadhi']);
  });

  it('refuses a photo that is outside the Photos folder', async () => {
    const storage = {
      getConfiguredProvider() {
        return { openReadStream: async () => ({ stream: null, contentType: 'image/jpeg', contentLength: 1 }) };
      },
      async getFileMetadata(id) {
        if (id === 'outside') {
          return photo('outside', 'other.jpg', 'somewhere-else');
        }
        return {
          id: 'somewhere-else',
          name: 'Other',
          mimeType: 'application/vnd.google-apps.folder',
          parentId: 'not-the-wedding-root',
          isFolder: true,
        };
      },
    };

    await expect(
      openGalleryFile('outside', { storage, rootFolderId: 'photos-root' }),
    ).rejects.toMatchObject({ code: forbiddenError().code });
  });

  it('streams a video inside the Photos folder and forwards a byte range', async () => {
    const ranges = [];
    const openReadStream = async (_id, options) => {
      ranges.push(options.range);
      return {
        stream: 'body',
        statusCode: 206,
        contentType: 'video/mp4',
        contentLength: 4,
        contentRange: 'bytes 0-3/9',
      };
    };
    const storage = {
      getConfiguredProvider() {
        return { openReadStream };
      },
      async getFileMetadata() {
        return {
          ...photo('clip', 'vows.mp4', 'photos-root'),
          mimeType: 'video/mp4',
        };
      },
    };

    const file = await openGalleryFile('clip', {
      storage,
      rootFolderId: 'photos-root',
      range: 'bytes=0-3',
    });

    expect(ranges).toEqual(['bytes=0-3']);
    expect(file.preview).toBe(false);
    expect(file).toMatchObject({
      statusCode: 206,
      contentType: 'video/mp4',
      contentRange: 'bytes 0-3/9',
    });
  });

  it('asks Drive for a thumbnail when a photo is opened as a preview', async () => {
    const calls = [];
    const storage = {
      getConfiguredProvider() {
        return {
          openReadStream: async (_id, options) => {
            calls.push(options);
            return {
              stream: 'thumb',
              statusCode: 200,
              contentType: 'image/jpeg',
              contentLength: 20,
            };
          },
        };
      },
      async getFileMetadata() {
        return photo('still', 'portrait.jpg', 'photos-root');
      },
    };

    const file = await openGalleryFile('still', {
      storage,
      rootFolderId: 'photos-root',
      preview: true,
      range: 'bytes=0-3',
    });

    expect(calls).toEqual([{ range: undefined, variant: 'preview' }]);
    expect(file.preview).toBe(true);
    expect(file.contentRange).toBeNull();
  });

  it('blocks a film when the viewer is not allowed to watch video', async () => {
    const storage = {
      getConfiguredProvider() {
        return { openReadStream: async () => ({ stream: null }) };
      },
      async getFileMetadata() {
        return {
          ...photo('clip', 'vows.mp4', 'photos-root'),
          mimeType: 'video/mp4',
        };
      },
    };

    await expect(
      openGalleryFile('clip', {
        storage,
        rootFolderId: 'photos-root',
        allowVideo: false,
      }),
    ).rejects.toMatchObject({ code: forbiddenError().code });
  });

  it('rejects a file that is neither a photo nor a video', async () => {
    const storage = {
      getConfiguredProvider() {
        return { openReadStream: async () => ({ stream: null }) };
      },
      async getFileMetadata() {
        return {
          ...photo('doc', 'notes.pdf', 'photos-root'),
          mimeType: 'application/pdf',
        };
      },
    };

    await expect(
      openGalleryFile('doc', { storage, rootFolderId: 'photos-root' }),
    ).rejects.toMatchObject({ code: badRequestError('x').code });
  });
});

describe('GET /api/v1/gallery', () => {
  const app = createApp();

  it('requires a signed-in user', async () => {
    const response = await request(app).get('/api/v1/gallery');
    expect(response.status).toBe(401);
  });

  it('returns the wedding gallery without storage secrets', async () => {
    const family = await seedUser({
      email: 'gallery-family@example.com',
      role: USER_ROLES.FAMILY,
    });
    const { agent } = await loginAs(app, {
      email: family.user.email,
      password: family.password,
    });

    const response = await agent.get('/api/v1/gallery');

    expect(response.status).toBe(200);
    expect(response.body.data.coupleName).toBe('Rohit & Roshni');
    expect(response.body.data.haldi.title).toBe('Haldi');
    expect(JSON.stringify(response.body)).not.toMatch(/clientSecret|refreshToken|secretAccessKey/);
    if (response.body.data.ready) {
      expect(Array.isArray(response.body.data.slider)).toBe(true);
    } else {
      expect(response.body.data.message).toMatch(/Google Drive/i);
    }
  });
});
