import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@wedding-memory/shared';
import { saveAlbumAccess } from '../src/services/admin/album-access.service.js';
import { getGalleryAlbum, getWeddingGallery, openGalleryFile } from '../src/services/gallery/gallery.service.js';
import { forbiddenError } from '../src/utils/errors.js';
import { seedUser } from './helpers/auth.js';

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

function galleryStorage() {
  return {
    getConfiguredProvider() {
      return { openReadStream: async () => ({ stream: 'body', contentType: 'image/jpeg', contentLength: 4 }) };
    },
    async listFolders() {
      return { items: [folder('sadhi', 'Sadhi_Event_Photos'), folder('open', 'RohitRoshni')], nextPageToken: null };
    },
    async listFiles({ folderId }) {
      if (folderId === 'sadhi') return { items: [photo('p4', 'sadhi-1.jpg', 'sadhi')], nextPageToken: null };
      if (folderId === 'open') return { items: [photo('p5', 'open-1.jpg', 'open')], nextPageToken: null };
      return { items: [], nextPageToken: null };
    },
    async getFileMetadata(id) {
      if (id === 'p4') return photo('p4', 'sadhi-1.jpg', 'sadhi');
      return {
        id: 'sadhi',
        name: 'Sadhi_Event_Photos',
        mimeType: 'application/vnd.google-apps.folder',
        isFolder: true,
        parentId: 'photos-root',
      };
    },
  };
}

describe('private albums', () => {
  it('hides a private album from guests who were not invited and keeps open albums visible', async () => {
    const family = await seedUser({
      email: 'family-private@example.com',
      role: USER_ROLES.FAMILY,
    });
    const invited = await seedUser({
      email: 'invited-private@example.com',
      role: USER_ROLES.VIEWER,
    });
    await saveAlbumAccess('sadhi', {
      secret: true,
      memberIds: [String(invited.user.id)],
    });

    const storage = galleryStorage();
    const options = {
      storage,
      rootFolderId: 'photos-root',
      coupleName: 'Rohit & Roshni',
    };

    const familyView = await getWeddingGallery({
      ...options,
      user: { id: String(family.user.id), role: USER_ROLES.FAMILY },
    });
    const invitedView = await getWeddingGallery({
      ...options,
      user: { id: String(invited.user.id), role: USER_ROLES.VIEWER },
    });
    const coupleView = await getWeddingGallery({
      ...options,
      user: { id: 'couple', role: USER_ROLES.MASTER },
    });

    expect(familyView.albums.map((album) => album.id)).toEqual(['open']);
    expect(invitedView.albums.map((album) => album.id)).toEqual(['open', 'sadhi']);
    expect(coupleView.albums.map((album) => album.id)).toEqual(['open', 'sadhi']);
  });

  it('blocks the album page and the photo itself when the guest is not invited', async () => {
    const family = await seedUser({
      email: 'family-stream@example.com',
      role: USER_ROLES.FAMILY,
    });
    const invited = await seedUser({
      email: 'invited-stream@example.com',
      role: USER_ROLES.FAMILY,
    });
    await saveAlbumAccess('sadhi', {
      secret: true,
      memberIds: [String(invited.user.id)],
    });

    const storage = galleryStorage();
    const familyUser = { id: String(family.user.id), role: USER_ROLES.FAMILY };
    const invitedUser = { id: String(invited.user.id), role: USER_ROLES.FAMILY };

    await expect(
      getGalleryAlbum('sadhi', {}, { storage, rootFolderId: 'photos-root', user: familyUser }),
    ).rejects.toMatchObject({ code: forbiddenError().code });

    await expect(
      openGalleryFile('p4', { storage, rootFolderId: 'photos-root', user: familyUser }),
    ).rejects.toMatchObject({ code: forbiddenError().code });

    const album = await getGalleryAlbum('sadhi', {}, {
      storage,
      rootFolderId: 'photos-root',
      user: invitedUser,
    });
    expect(album.photos.map((item) => item.id)).toEqual(['p4']);

    const file = await openGalleryFile('p4', {
      storage,
      rootFolderId: 'photos-root',
      user: invitedUser,
    });
    expect(file.stream).toBe('body');
  });

  it('does not accept a couple account as a guest on a private album', async () => {
    const master = await seedUser({
      email: 'master-member@example.com',
      role: USER_ROLES.MASTER,
    });

    await expect(
      saveAlbumAccess('sadhi', { secret: true, memberIds: [String(master.user.id)] }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
