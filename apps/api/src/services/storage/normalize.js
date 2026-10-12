import {
  createStorageFile,
  createStorageFolder,
  isStorageProviderType,
} from './types.js';

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function asNullableString(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value);
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function asNullableNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

/**
 * Normalize a provider-specific file payload into StorageFile.
 *
 * @param {Record<string, unknown>} raw
 * @param {import('./types.js').StorageProviderType} provider
 * @returns {import('./types.js').StorageFile}
 */
export function normalizeStorageFile(raw, provider) {
  if (!raw || typeof raw !== 'object') {
    throw new TypeError('normalizeStorageFile expects an object');
  }
  if (!isStorageProviderType(provider)) {
    throw new TypeError(`Invalid provider for normalizeStorageFile: ${provider}`);
  }

  const id = raw.id ?? raw.providerFileId ?? raw.key ?? raw.storageKey;
  if (id === undefined || id === null || id === '') {
    throw new TypeError('normalizeStorageFile requires id, providerFileId, or storageKey');
  }

  const name = raw.name ?? raw.fileName ?? raw.title ?? String(id);

  return createStorageFile({
    id: String(id),
    name: String(name),
    mimeType:
      typeof raw.mimeType === 'string' && raw.mimeType
        ? raw.mimeType
        : 'application/octet-stream',
    size: asNullableNumber(raw.size ?? raw.fileSize ?? raw.contentLength),
    provider,
    providerFileId: String(raw.providerFileId ?? id),
    storageKey: asNullableString(raw.storageKey ?? raw.key),
    parentId: asNullableString(raw.parentId ?? raw.folderId ?? raw.parent),
    isFolder: Boolean(raw.isFolder ?? raw.folder),
    createdAt: asNullableString(raw.createdAt ?? raw.createdTime),
    updatedAt: asNullableString(raw.updatedAt ?? raw.modifiedTime ?? raw.lastModified),
  });
}

/**
 * @param {Record<string, unknown>} raw
 * @param {import('./types.js').StorageProviderType} provider
 * @returns {import('./types.js').StorageFolder}
 */
export function normalizeStorageFolder(raw, provider) {
  if (!raw || typeof raw !== 'object') {
    throw new TypeError('normalizeStorageFolder expects an object');
  }
  if (!isStorageProviderType(provider)) {
    throw new TypeError(`Invalid provider for normalizeStorageFolder: ${provider}`);
  }

  const id = raw.id ?? raw.providerFileId ?? raw.key;
  if (id === undefined || id === null || id === '') {
    throw new TypeError('normalizeStorageFolder requires id or providerFileId');
  }

  const name = raw.name ?? raw.folderName ?? raw.title ?? String(id);

  return createStorageFolder({
    id: String(id),
    name: String(name),
    provider,
    providerFileId: String(raw.providerFileId ?? id),
    parentId: asNullableString(raw.parentId ?? raw.folderId ?? raw.parent),
    createdAt: asNullableString(raw.createdAt ?? raw.createdTime),
    updatedAt: asNullableString(raw.updatedAt ?? raw.modifiedTime),
  });
}

/**
 * @param {{ items?: unknown[]; nextPageToken?: unknown }} raw
 * @param {import('./types.js').StorageProviderType} provider
 * @returns {import('./types.js').StorageListFilesResult}
 */
export function normalizeFileList(raw, provider) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: items.map((item) =>
      normalizeStorageFile(/** @type {Record<string, unknown>} */ (item), provider),
    ),
    nextPageToken: asNullableString(raw?.nextPageToken),
  };
}

/**
 * @param {{ items?: unknown[]; nextPageToken?: unknown }} raw
 * @param {import('./types.js').StorageProviderType} provider
 * @returns {import('./types.js').StorageListFoldersResult}
 */
export function normalizeFolderList(raw, provider) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: items.map((item) =>
      normalizeStorageFolder(/** @type {Record<string, unknown>} */ (item), provider),
    ),
    nextPageToken: asNullableString(raw?.nextPageToken),
  };
}

/**
 * @param {Record<string, unknown>} raw
 * @param {import('./types.js').StorageProviderType} provider
 * @returns {import('./types.js').StorageUploadUrlResult}
 */
export function normalizeUploadUrlResult(raw, provider) {
  if (!raw?.uploadUrl || typeof raw.uploadUrl !== 'string') {
    throw new TypeError('normalizeUploadUrlResult requires uploadUrl');
  }

  return {
    uploadUrl: raw.uploadUrl,
    provider,
    storageKey: asNullableString(raw.storageKey ?? raw.key),
    providerFileId: asNullableString(raw.providerFileId ?? raw.id),
    method: typeof raw.method === 'string' && raw.method ? raw.method : 'PUT',
    headers:
      raw.headers && typeof raw.headers === 'object' && !Array.isArray(raw.headers)
        ? /** @type {Record<string, string>} */ (raw.headers)
        : {},
    expiresInSeconds: asNullableNumber(raw.expiresInSeconds),
  };
}

/**
 * @param {string | { previewUrl?: string; url?: string; expiresInSeconds?: unknown }} raw
 * @param {import('./types.js').StorageProviderType} provider
 * @param {string} fileId
 * @returns {import('./types.js').StoragePreviewUrlResult}
 */
export function normalizePreviewUrlResult(raw, provider, fileId) {
  const previewUrl =
    typeof raw === 'string' ? raw : (raw?.previewUrl ?? raw?.url ?? null);
  if (!previewUrl || typeof previewUrl !== 'string') {
    throw new TypeError('normalizePreviewUrlResult requires a URL string');
  }

  return {
    previewUrl,
    provider,
    fileId: String(fileId),
    expiresInSeconds:
      typeof raw === 'object' && raw ? asNullableNumber(raw.expiresInSeconds) : null,
  };
}

/**
 * @param {string | { downloadUrl?: string; url?: string; expiresInSeconds?: unknown }} raw
 * @param {import('./types.js').StorageProviderType} provider
 * @param {string} fileId
 * @returns {import('./types.js').StorageDownloadUrlResult}
 */
export function normalizeDownloadUrlResult(raw, provider, fileId) {
  const downloadUrl =
    typeof raw === 'string' ? raw : (raw?.downloadUrl ?? raw?.url ?? null);
  if (!downloadUrl || typeof downloadUrl !== 'string') {
    throw new TypeError('normalizeDownloadUrlResult requires a URL string');
  }

  return {
    downloadUrl,
    provider,
    fileId: String(fileId),
    expiresInSeconds:
      typeof raw === 'object' && raw ? asNullableNumber(raw.expiresInSeconds) : null,
  };
}
