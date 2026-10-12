import { STORAGE_PROVIDERS } from '@wedding-memory/shared';
import { config } from '../../config/index.js';
import { badRequestError, forbiddenError, notFoundError } from '../../utils/errors.js';
import { getStorageManager } from '../storage/storage.service.js';
import { applyAlbumPrivacy, assertFolderOpen, hiddenFolderIdsFor } from '../admin/album-access.service.js';
import {
  displayFolderTitle,
  galleryMediaKind,
  galleryRoleForFolder,
  partitionGalleryFolders,
  safeDownloadFilename,
  toGalleryPhoto,
} from './gallery-catalog.js';

const DRIVE = STORAGE_PROVIDERS.GOOGLE_DRIVE;
const CACHE_MS = 60_000;

/** @type {{ at: number, value: unknown } | null} */
let galleryCache = null;

export function clearGalleryCache() {
  galleryCache = null;
}

function emptyGallery(coupleName, message) {
  return {
    ready: false,
    coupleName,
    message,
    slider: [],
    featured: [],
    couple: [],
    haldi: {
      id: null,
      title: 'Haldi',
      photos: [],
    },
    albums: [],
    trailer: null,
  };
}

/**
 * @param {import('../storage/storage-manager.js').StorageManager} storage
 * @param {string} folderId
 * @param {number} pageSize
 * @param {string} [pageToken]
 */
const BYTE_RANGE = /^bytes=\d+-\d*$/;

/**
 * @param {unknown} range
 */
function sanitizeByteRange(range) {
  if (typeof range !== 'string') return undefined;
  const value = range.trim();
  return BYTE_RANGE.test(value) ? value : undefined;
}

/**
 * @param {import('../storage/storage-manager.js').StorageManager} storage
 * @param {string} folderId
 * @param {number} pageSize
 * @param {string} [pageToken]
 */
async function listImages(storage, folderId, pageSize, pageToken) {
  const result = await storage.listFiles(
    { folderId, pageSize, pageToken, kind: 'media' },
    DRIVE,
  );
  return {
    photos: result.items
      .filter((item) => !item.isFolder && galleryMediaKind(item.mimeType))
      .map(toGalleryPhoto),
    nextPageToken: result.nextPageToken,
  };
}

/**
 * Use photos in the folder. If it only contains subfolders, take the first images inside those.
 *
 * @param {import('../storage/storage-manager.js').StorageManager} storage
 * @param {string} folderId
 * @param {number} pageSize
 */
async function listSectionPhotos(storage, folderId, pageSize) {
  const direct = await listImages(storage, folderId, pageSize);
  if (direct.photos.length > 0) {
    return direct.photos;
  }

  const nested = await storage.listFolders({ parentId: folderId, pageSize: 20 }, DRIVE);
  const photos = [];

  for (const folder of nested.items) {
    if (photos.length >= pageSize) break;
    const inner = await listImages(storage, folder.id, pageSize - photos.length);
    photos.push(...inner.photos);
  }

  return photos;
}

/**
 * CoupleShoot can sit beside the other folders, or inside a folder such as RohitRoshni.
 *
 * @param {import('../storage/storage-manager.js').StorageManager} storage
 * @param {ReturnType<typeof partitionGalleryFolders>} grouped
 */
async function resolveCoupleFolder(storage, grouped) {
  if (grouped.couple) return { folder: grouped.couple, parentId: null };

  for (const album of grouped.albums) {
    const children = await storage.listFolders({ parentId: album.id, pageSize: 40 }, DRIVE);
    const match = (children.items || []).find((item) => galleryRoleForFolder(item.name) === 'couple');
    if (!match) continue;
    return {
      folder: {
        ...match,
        role: 'couple',
        title: displayFolderTitle(match.name, 'couple'),
      },
      parentId: album.id,
    };
  }

  return { folder: null, parentId: null };
}

/**
 * A wedding folder is either directly under Photos, or one level inside another folder.
 *
 * @param {import('../storage/storage-manager.js').StorageManager} storage
 * @param {string} rootFolderId
 * @param {string} folderId
 */
async function findWeddingFolder(storage, rootFolderId, folderId) {
  const folderList = await storage.listFolders({ parentId: rootFolderId, pageSize: 100 }, DRIVE);
  const direct = folderList.items.find((item) => item.id === folderId);
  if (direct) return direct;

  for (const parent of folderList.items) {
    const children = await storage.listFolders({ parentId: parent.id, pageSize: 40 }, DRIVE);
    const nested = (children.items || []).find((item) => item.id === folderId);
    if (nested) return nested;
  }

  return null;
}

/**
 * @param {object} [options]
 * @param {import('../storage/storage-manager.js').StorageManager} [options.storage]
 * @param {string} [options.rootFolderId]
 * @param {string} [options.coupleName]
 */
export async function getWeddingGallery(options = {}) {
  const coupleName = options.coupleName ?? config.website.coupleName;
  const rootFolderId = options.rootFolderId ?? config.storage.googleDrive.rootFolderId;
  const storage = options.storage ?? getStorageManager();
  const useCache = !options.storage && options.rootFolderId === undefined;

  if (useCache && galleryCache && Date.now() - galleryCache.at < CACHE_MS) {
    return deliverGallery(galleryCache.value, options);
  }

  try {
    storage.getConfiguredProvider(DRIVE);
  } catch (error) {
    if (error?.code === 'STORAGE_NOT_CONFIGURED') {
      return emptyGallery(
        coupleName,
        'Google Drive is not connected on the server yet, so wedding photos cannot be shown.',
      );
    }
    throw error;
  }

  if (!rootFolderId) {
    return emptyGallery(
      coupleName,
      'The Google Drive photos folder is not set on the server yet.',
    );
  }

  const folderList = await storage.listFolders({ parentId: rootFolderId, pageSize: 100 }, DRIVE);
  const grouped = partitionGalleryFolders(folderList.items);

  const coupleSource = await resolveCoupleFolder(storage, grouped);
  const coupleFolder = coupleSource.folder;

  const [slider, featured, haldiPhotos, couplePhotos, trailerMedia, albums] = await Promise.all([
    grouped.slider
      ? listSectionPhotos(storage, grouped.slider.id, 8)
      : Promise.resolve([]),
    grouped.featured
      ? listSectionPhotos(storage, grouped.featured.id, 12)
      : Promise.resolve([]),
    grouped.haldi ? listSectionPhotos(storage, grouped.haldi.id, 18) : Promise.resolve([]),
    coupleFolder ? listSectionPhotos(storage, coupleFolder.id, 18) : Promise.resolve([]),
    grouped.trailer
      ? listSectionPhotos(storage, grouped.trailer.id, 8)
      : Promise.resolve([]),
    Promise.all(
      grouped.albums.map(async (album) => {
        const photos = await listSectionPhotos(storage, album.id, 8);
        return {
          id: album.id,
          name: album.name,
          title: album.title,
          cover: photos.find((item) => item.kind === 'image') ?? null,
        };
      }),
    ),
  ]);

  const coupleAlbum = coupleFolder
    ? {
        id: coupleFolder.id,
        name: coupleFolder.name,
        title: displayFolderTitle(coupleFolder.name, 'couple'),
        parentId: coupleSource.parentId,
        cover: couplePhotos.find((item) => item.kind === 'image') ?? null,
      }
    : null;
  const listedAlbums = coupleAlbum
    ? [...albums, coupleAlbum].sort((left, right) => left.title.localeCompare(right.title))
    : albums;

  const gallery = {
    ready: true,
    coupleName,
    message: null,
    slider,
    sliderFolderId: grouped.slider?.id ?? null,
    featured,
    featuredFolderId: grouped.featured?.id ?? null,
    couple: couplePhotos,
    coupleFolderId: coupleFolder?.id ?? null,
    coupleParentId: coupleSource.parentId,
    haldi: {
      id: grouped.haldi?.id ?? null,
      title: 'Haldi',
      photos: haldiPhotos,
    },
    albums: listedAlbums,
    trailer: grouped.trailer
      ? {
          id: grouped.trailer.id,
          title: 'Wedding treasure',
          video: trailerMedia.find((item) => item.kind === 'video') ?? null,
        }
      : null,
  };

  if (useCache) {
    galleryCache = { at: Date.now(), value: gallery };
  }

  return deliverGallery(gallery, options);
}

/**
 * @param {object} gallery
 * @param {{ includeVideos?: boolean, user?: { id?: string, role?: string } }} options
 */
async function deliverGallery(gallery, options) {
  const presented = presentGallery(gallery, options.includeVideos);
  if (!options.user) return presented;
  return applyAlbumPrivacy(presented, await hiddenFolderIdsFor(options.user));
}

/**
 * @param {string} folderId
 * @param {{ pageToken?: string, pageSize?: number }} [query]
 * @param {object} [options]
 */
export async function getGalleryAlbum(folderId, query = {}, options = {}) {
  const storage = options.storage ?? getStorageManager();
  const rootFolderId = options.rootFolderId ?? config.storage.googleDrive.rootFolderId;

  storage.getConfiguredProvider(DRIVE);

  if (!rootFolderId) {
    throw badRequestError('The Google Drive photos folder is not set on the server yet.');
  }

  const folder = await findWeddingFolder(storage, rootFolderId, folderId);

  if (!folder) {
    throw notFoundError('Album not found in the wedding photos folder');
  }

  await assertFolderOpen([folder.id], options.user);

  const pageSize = query.pageSize ?? 40;
  const images = await listImages(storage, folder.id, pageSize, query.pageToken);
  const role = galleryRoleForFolder(folder.name);
  const photos =
    options.includeVideos === false
      ? images.photos.filter((item) => item.kind !== 'video')
      : images.photos;

  return {
    album: {
      id: folder.id,
      name: folder.name,
      title: displayFolderTitle(folder.name, role),
      role,
    },
    photos,
    nextPageToken: images.nextPageToken,
  };
}

/**
 * Cached galleries include videos. Strip them per request so a viewer
 * cannot receive a family member's cached film list.
 *
 * @param {object} gallery
 * @param {boolean | undefined} includeVideos
 */
function presentGallery(gallery, includeVideos) {
  if (includeVideos !== false || !gallery?.ready) {
    return gallery;
  }

  const keepPhoto = (item) => item.kind !== 'video';
  return {
    ...gallery,
    slider: gallery.slider.filter(keepPhoto),
    featured: gallery.featured.filter(keepPhoto),
    couple: (gallery.couple || []).filter(keepPhoto),
    haldi: {
      ...gallery.haldi,
      photos: gallery.haldi.photos.filter(keepPhoto),
    },
    albums: gallery.albums.map((album) => ({
      ...album,
      cover: album.cover && keepPhoto(album.cover) ? album.cover : null,
    })),
    trailer: null,
  };
}

/**
 * Stream a photo or video only when it lives under the configured Photos folder.
 *
 * @param {string} fileId
 * @param {object} [options]
 * @param {string} [options.range]
 * @param {boolean} [options.allowVideo]
 * @param {boolean} [options.preview]
 */
export async function openGalleryFile(fileId, options = {}) {
  const storage = options.storage ?? getStorageManager();
  const rootFolderId = options.rootFolderId ?? config.storage.googleDrive.rootFolderId;
  const provider = storage.getConfiguredProvider(DRIVE);

  if (!rootFolderId) {
    throw badRequestError('The Google Drive photos folder is not set on the server yet.');
  }

  const { photo, folderIds } = await assertPhotoInsideRoot(storage, fileId, rootFolderId, options.allowVideo);
  await assertFolderOpen(folderIds, options.user);
  const preview = options.preview === true && galleryMediaKind(photo.mimeType) === 'image';
  const opened = await provider.openReadStream(fileId, {
    range: preview ? undefined : sanitizeByteRange(options.range),
    variant: preview ? 'preview' : 'full',
  });

  return {
    stream: opened.stream,
    statusCode: opened.statusCode || 200,
    contentType: preview ? opened.contentType || photo.mimeType : photo.mimeType || opened.contentType,
    contentLength: opened.contentLength,
    contentRange: preview ? null : opened.contentRange || null,
    filename: safeDownloadFilename(photo.name),
    preview,
  };
}

/**
 * @param {import('../storage/storage-manager.js').StorageManager} storage
 * @param {string} fileId
 * @param {string} rootFolderId
 * @param {boolean} [allowVideo]
 */
async function assertPhotoInsideRoot(storage, fileId, rootFolderId, allowVideo = true) {
  const photo = await storage.getFileMetadata(fileId, DRIVE);
  const kind = galleryMediaKind(photo.mimeType);

  if (!kind) {
    throw badRequestError('Only photos and videos from the wedding folder can be displayed');
  }

  if (kind === 'video' && allowVideo === false) {
    throw forbiddenError('Films are limited to family access');
  }

  const folderIds = [];
  let cursor = photo;
  for (let depth = 0; depth < 6; depth += 1) {
    if (cursor.parentId === rootFolderId) {
      return { photo, folderIds };
    }
    if (!cursor.parentId) {
      break;
    }
    folderIds.push(cursor.parentId);
    cursor = await storage.getFileMetadata(cursor.parentId, DRIVE);
  }

  throw forbiddenError('This photo is outside the wedding gallery folder');
}
