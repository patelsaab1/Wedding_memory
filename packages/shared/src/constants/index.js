/** Supported media storage providers (metadata only — never store media on the API server). */
export const STORAGE_PROVIDERS = Object.freeze({
  GOOGLE_DRIVE: 'google_drive',
  R2: 'r2',
});

/** Media classification used across API and web. */
export const MEDIA_TYPES = Object.freeze({
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
});

/** Visibility levels for media, documents, and galleries. */
export const VISIBILITY = Object.freeze({
  PRIVATE: 'private',
  FAMILY: 'family',
  SHARED: 'shared',
  PUBLIC: 'public',
});

/** Application roles. */
export const USER_ROLES = Object.freeze({
  MASTER: 'master',
  WIFE: 'wife',
  FAMILY: 'family',
  VIEWER: 'viewer',
});

/**
 * Centralized permission keys.
 * Use these everywhere instead of scattering role string checks in UI.
 */
export const PERMISSIONS = Object.freeze({
  MEDIA_VIEW: 'media.view',
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_DELETE: 'media.delete',
  GALLERY_VIEW: 'gallery.view',
  VIDEO_VIEW: 'video.view',
  ALBUM_VIEW: 'album.view',
  ALBUM_MANAGE: 'album.manage',
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_MANAGE: 'documents.manage',
  WEBSITE_MANAGE: 'website.manage',
  SHARING_MANAGE: 'sharing.manage',
  USERS_MANAGE: 'users.manage',
  STORAGE_MANAGE: 'storage.manage',
});

/** Default permissions granted per role. */
export const ROLE_PERMISSIONS = Object.freeze({
  [USER_ROLES.MASTER]: Object.freeze(Object.values(PERMISSIONS)),
  [USER_ROLES.WIFE]: Object.freeze([
    PERMISSIONS.GALLERY_VIEW,
    PERMISSIONS.VIDEO_VIEW,
    PERMISSIONS.ALBUM_VIEW,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_MANAGE,
    PERMISSIONS.SHARING_MANAGE,
    PERMISSIONS.MEDIA_UPLOAD,
  ]),
  [USER_ROLES.FAMILY]: Object.freeze([
    PERMISSIONS.GALLERY_VIEW,
    PERMISSIONS.VIDEO_VIEW,
    PERMISSIONS.ALBUM_VIEW,
    PERMISSIONS.MEDIA_VIEW,
  ]),
  [USER_ROLES.VIEWER]: Object.freeze([PERMISSIONS.MEDIA_VIEW]),
});

/**
 * Permissions that MASTER may grant to WIFE accounts (configurable access).
 * Wife `allowedPermissions` must be a subset of this list.
 */
export const WIFE_CONFIGURABLE_PERMISSIONS = Object.freeze([
  PERMISSIONS.GALLERY_VIEW,
  PERMISSIONS.VIDEO_VIEW,
  PERMISSIONS.ALBUM_VIEW,
  PERMISSIONS.MEDIA_VIEW,
  PERMISSIONS.MEDIA_UPLOAD,
  PERMISSIONS.DOCUMENTS_VIEW,
  PERMISSIONS.DOCUMENTS_MANAGE,
  PERMISSIONS.SHARING_MANAGE,
]);

/** Shareable resource types. */
export const SHARE_RESOURCE_TYPES = Object.freeze({
  ALBUM: 'album',
  MEDIA: 'media',
  DOCUMENT: 'document',
  GALLERY: 'gallery',
});

/** Website section types. */
export const WEBSITE_SECTION_TYPES = Object.freeze({
  HERO: 'hero',
  STORY: 'story',
  TIMELINE: 'timeline',
  GALLERY: 'gallery',
  FAMILY: 'family',
  CUSTOM: 'custom',
  ART_WALL: 'art_wall',
  COUPLE_GALLERY: 'couple_gallery',
  CINEMATIC_REVEAL: 'cinematic_reveal',
  FLOATING_COLLAGE: 'floating_collage',
  CINEMATIC_WIDE: 'cinematic_wide',
});

/** Album categories. */
export const ALBUM_CATEGORIES = Object.freeze({
  WEDDING: 'wedding',
  ENGAGEMENT: 'engagement',
  FAMILY: 'family',
  CEREMONY: 'ceremony',
  RECEPTION: 'reception',
  OTHER: 'other',
});

/** Storage connection status (safe metadata only). */
export const STORAGE_CONNECTION_STATUS = Object.freeze({
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
  ERROR: 'error',
});

export const API_PREFIX = '/api/v1';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const AUTH_COOKIES = Object.freeze({
  ACCESS: 'wm_access',
  REFRESH: 'wm_refresh',
  CSRF: 'wm_csrf',
});
