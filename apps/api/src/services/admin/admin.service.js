import { STORAGE_PROVIDERS } from '@wedding-memory/shared';
import { config } from '../../config/index.js';
import { badRequestError, notFoundError } from '../../utils/errors.js';
import { clearGalleryCache } from '../gallery/gallery.service.js';
import { displayFolderTitle } from '../gallery/gallery-catalog.js';
import { getStorageManager } from '../storage/storage.service.js';

const DRIVE = STORAGE_PROVIDERS.GOOGLE_DRIVE;

const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

function rootFolderId() {
  const id = config.storage.googleDrive.rootFolderId;
  if (!id) {
    throw badRequestError('The Google Drive photos folder is not set on the server yet.');
  }
  return id;
}

function storage() {
  const manager = getStorageManager();
  manager.getConfiguredProvider(DRIVE);
  return manager;
}

/**
 * @param {string} title
 */
export async function createDriveAlbum(title) {
  const name = String(title || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 80) {
    throw badRequestError('Album title should be between 2 and 80 characters');
  }
  if (/[\\/]/.test(name)) {
    throw badRequestError('Album title cannot include slashes');
  }

  const manager = storage();
  const created = await manager.createFolder({ name, parentId: rootFolderId() }, DRIVE);
  clearGalleryCache();
  return {
    id: created.id,
    title: displayFolderTitle(created.name || name, 'album'),
  };
}

export async function listDriveFolders() {
  const manager = storage();
  const listed = await manager.listFolders({ parentId: rootFolderId(), pageSize: 100 }, DRIVE);
  return listed.items
    .map((folder) => ({
      id: folder.id,
      title: displayFolderTitle(folder.name, 'album'),
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

/**
 * @param {string} folderId
 * @param {{ originalname?: string, mimetype?: string, buffer?: Buffer, size?: number }} file
 */
export async function uploadDriveFile(folderId, file) {
  if (!file?.buffer?.length) {
    throw badRequestError('Choose a photo or film to add');
  }

  const mimeType = String(file.mimetype || '');
  if (!ALLOWED_UPLOAD_TYPES.has(mimeType)) {
    throw badRequestError('Only JPEG, PNG, WebP, GIF, MP4, MOV, and WebM files can be added');
  }

  const manager = storage();
  const folders = await manager.listFolders({ parentId: rootFolderId(), pageSize: 100 }, DRIVE);
  const folder = folders.items.find((item) => item.id === folderId);
  if (!folder) {
    throw notFoundError('That album is not inside the wedding photos folder');
  }

  const safeName = String(file.originalname || 'wedding-photo')
    .replace(/["\r\n\\/]/g, '')
    .slice(0, 180)
    .trim() || 'wedding-photo';

  const provider = manager.getConfiguredProvider(DRIVE);
  const uploaded = await provider.uploadFile({
    name: safeName,
    parentId: folderId,
    mimeType,
    body: file.buffer,
  });

  clearGalleryCache();
  return {
    id: uploaded.id,
    name: uploaded.name,
    mimeType: uploaded.mimeType,
  };
}
