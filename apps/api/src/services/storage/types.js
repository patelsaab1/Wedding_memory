import { STORAGE_PROVIDERS } from '@wedding-memory/shared';

/**
 * Normalized storage domain types.
 * Controllers and services must use these — never provider SDK shapes.
 */

/** @typedef {'google_drive' | 'r2'} StorageProviderType */

export const STORAGE_PROVIDER_TYPES = Object.freeze({
  GOOGLE_DRIVE: STORAGE_PROVIDERS.GOOGLE_DRIVE,
  R2: STORAGE_PROVIDERS.R2,
});

/** @type {readonly StorageProviderType[]} */
export const STORAGE_PROVIDER_TYPE_VALUES = Object.freeze(
  Object.values(STORAGE_PROVIDER_TYPES),
);

/**
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
 * @property {Record<string, string>} [metadata]
 */

/**
 * @typedef {Object} StorageDownloadRequest
 * @property {string} fileId
 * @property {string} [fileName]
 * @property {boolean} [inline]
 * @property {number} [expiresInSeconds]
 */

/**
 * @typedef {Object} StorageUploadUrlResult
 * @property {string} uploadUrl
 * @property {StorageProviderType} provider
 * @property {string | null} storageKey
 * @property {string | null} providerFileId
 * @property {string} method
 * @property {Record<string, string>} headers
 * @property {number | null} expiresInSeconds
 */

/**
 * @typedef {Object} StorageDownloadUrlResult
 * @property {string} downloadUrl
 * @property {StorageProviderType} provider
 * @property {string} fileId
 * @property {number | null} expiresInSeconds
 */

/**
 * @typedef {Object} StoragePreviewUrlResult
 * @property {string} previewUrl
 * @property {StorageProviderType} provider
 * @property {string} fileId
 * @property {number | null} expiresInSeconds
 */

/**
 * @typedef {Object} StorageListFilesResult
 * @property {StorageFile[]} items
 * @property {string | null} nextPageToken
 */

/**
 * @typedef {Object} StorageListFoldersResult
 * @property {StorageFolder[]} items
 * @property {string | null} nextPageToken
 */

/**
 * @typedef {Object} StorageProviderConfigStatus
 * @property {StorageProviderType} type
 * @property {boolean} configured
 * @property {string[]} missing
 * @property {string | null} message
 */

/**
 * @param {unknown} value
 * @returns {value is StorageProviderType}
 */
export function isStorageProviderType(value) {
  return (
    typeof value === 'string' &&
    STORAGE_PROVIDER_TYPE_VALUES.includes(/** @type {StorageProviderType} */ (value))
  );
}

/**
 * @param {Partial<StorageFile> & { id: string; name: string; provider: StorageProviderType }} input
 * @returns {StorageFile}
 */
export function createStorageFile(input) {
  return {
    id: String(input.id),
    name: String(input.name),
    mimeType: input.mimeType ?? 'application/octet-stream',
    size: typeof input.size === 'number' ? input.size : null,
    provider: input.provider,
    providerFileId: String(input.providerFileId ?? input.id),
    storageKey: input.storageKey ?? null,
    parentId: input.parentId ?? null,
    isFolder: Boolean(input.isFolder),
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
  };
}

/**
 * @param {Partial<StorageFolder> & { id: string; name: string; provider: StorageProviderType }} input
 * @returns {StorageFolder}
 */
export function createStorageFolder(input) {
  return {
    id: String(input.id),
    name: String(input.name),
    provider: input.provider,
    providerFileId: String(input.providerFileId ?? input.id),
    parentId: input.parentId ?? null,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
  };
}
