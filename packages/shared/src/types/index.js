/**
 * Shared domain type documentation (JSDoc).
 * Runtime validation schemas will be added in later phases (Zod).
 */

/**
 * @typedef {'google_drive' | 'r2'} StorageProviderType
 * @typedef {StorageProviderType} StorageProvider
 */

/**
 * @typedef {'image' | 'video' | 'document' | 'other'} MediaType
 */

/**
 * @typedef {'private' | 'family' | 'shared' | 'public'} Visibility
 */

/**
 * Provider-agnostic file metadata used across API and web.
 * @typedef {Object} StorageFile
 * @property {string} id
 * @property {string} name
 * @property {string} mimeType
 * @property {number | null} size
 * @property {StorageProviderType} provider
 * @property {string} providerFileId
 * @property {string | null} storageKey
 * @property {string | null} parentId
 * @property {boolean} isFolder
 * @property {string | null} createdAt
 * @property {string | null} updatedAt
 */

/**
 * @typedef {Object} StorageFolder
 * @property {string} id
 * @property {string} name
 * @property {StorageProviderType} provider
 * @property {string} providerFileId
 * @property {string | null} parentId
 * @property {string | null} createdAt
 * @property {string | null} updatedAt
 */

/**
 * @typedef {Object} StorageUploadRequest
 * @property {string} fileName
 * @property {string} mimeType
 * @property {string} [folderId]
 * @property {string} [storageKey]
 * @property {number} [size]
 */

/**
 * @typedef {Object} StorageDownloadRequest
 * @property {string} fileId
 * @property {string} [fileName]
 * @property {boolean} [inline]
 * @property {number} [expiresInSeconds]
 */

/**
 * @typedef {Object} MediaThumbnail
 * @property {string} [url]
 * @property {string} [providerFileId]
 * @property {string} [storageKey]
 * @property {number} [width]
 * @property {number} [height]
 */

/**
 * Core media metadata shape stored in MongoDB (not the binary file).
 * @typedef {Object} MediaRecord
 * @property {string} id
 * @property {StorageProviderType} provider
 * @property {string} [providerFileId]
 * @property {string} [storageKey]
 * @property {string} [albumId]
 * @property {string} mimeType
 * @property {MediaType} mediaType
 * @property {string} fileName
 * @property {number} fileSize
 * @property {MediaThumbnail} [thumbnail]
 * @property {Visibility} visibility
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export {};
