import { StorageProvider } from './storage.interface.js';
import { storageInvalidProviderError } from './storage.errors.js';
import {
  normalizeDownloadUrlResult,
  normalizeFileList,
  normalizeFolderList,
  normalizePreviewUrlResult,
  normalizeStorageFile,
  normalizeStorageFolder,
  normalizeUploadUrlResult,
} from './normalize.js';
import { isStorageProviderType } from './types.js';

/**
 * Chooses a storage provider, validates configuration, delegates operations,
 * and normalizes provider responses into shared Storage* types.
 *
 * Controllers and domain services must depend on StorageManager —
 * never on Google Drive or Cloudflare R2 SDKs.
 */
export class StorageManager {
  /**
   * @param {object} options
   * @param {import('./types.js').StorageProviderType} options.defaultProvider
   * @param {Map<string, StorageProvider> | Record<string, StorageProvider>} options.providers
   */
  constructor({ defaultProvider, providers }) {
    if (!isStorageProviderType(defaultProvider)) {
      throw storageInvalidProviderError(defaultProvider);
    }

    /** @type {Map<string, StorageProvider>} */
    this.providers =
      providers instanceof Map ? providers : new Map(Object.entries(providers ?? {}));

    if (this.providers.size === 0) {
      throw new TypeError('StorageManager requires at least one provider');
    }

    /** @type {import('./types.js').StorageProviderType} */
    this.defaultProvider = defaultProvider;

    if (!this.providers.has(defaultProvider)) {
      throw storageInvalidProviderError(defaultProvider);
    }

    for (const [key, provider] of this.providers.entries()) {
      if (!(provider instanceof StorageProvider)) {
        throw new TypeError(`Provider "${key}" must extend StorageProvider`);
      }
      if (!isStorageProviderType(provider.type)) {
        throw storageInvalidProviderError(provider.type);
      }
    }
  }

  /**
   * @param {import('./types.js').StorageProviderType} [providerType]
   * @returns {StorageProvider}
   */
  getProvider(providerType) {
    const type = providerType ?? this.defaultProvider;
    if (!isStorageProviderType(type)) {
      throw storageInvalidProviderError(type);
    }

    const provider = this.providers.get(type);
    if (!provider) {
      throw storageInvalidProviderError(type);
    }

    return provider;
  }

  /**
   * @param {import('./types.js').StorageProviderType} [providerType]
   * @returns {StorageProvider}
   */
  getConfiguredProvider(providerType) {
    const provider = this.getProvider(providerType);
    provider.assertConfigured();
    return provider;
  }

  /**
   * Public-safe status — never includes secrets or credential values.
   */
  getStatus() {
    /** @type {Record<string, import('./types.js').StorageProviderConfigStatus>} */
    const providers = {};

    for (const [type, provider] of this.providers.entries()) {
      providers[type] = provider.getConfigStatus();
    }

    return {
      defaultProvider: this.defaultProvider,
      providers,
    };
  }

  /**
   * @param {{ folderId?: string; pageToken?: string; pageSize?: number }} [options]
   * @param {import('./types.js').StorageProviderType} [providerType]
   */
  async listFiles(options = {}, providerType) {
    const provider = this.getConfiguredProvider(providerType);
    const raw = await provider.listFiles(options);
    return normalizeFileList(raw ?? { items: [] }, provider.type);
  }

  /**
   * @param {string} fileId
   * @param {import('./types.js').StorageProviderType} [providerType]
   */
  async getFileMetadata(fileId, providerType) {
    const provider = this.getConfiguredProvider(providerType);
    const raw = await provider.getFileMetadata(fileId);
    return normalizeStorageFile(raw, provider.type);
  }

  /**
   * @param {string} fileId
   * @param {Record<string, unknown>} [options]
   * @param {import('./types.js').StorageProviderType} [providerType]
   */
  async getPreviewUrl(fileId, options = {}, providerType) {
    const provider = this.getConfiguredProvider(providerType);
    const raw = await provider.getPreviewUrl(fileId, options);
    return normalizePreviewUrlResult(raw, provider.type, fileId);
  }

  /**
   * @param {import('./types.js').StorageDownloadRequest} request
   * @param {import('./types.js').StorageProviderType} [providerType]
   */
  async getDownloadUrl(request, providerType) {
    const provider = this.getConfiguredProvider(providerType);
    const raw = await provider.getDownloadUrl(request);
    return normalizeDownloadUrlResult(raw, provider.type, request.fileId);
  }

  /**
   * @param {import('./types.js').StorageUploadRequest} request
   * @param {import('./types.js').StorageProviderType} [providerType]
   */
  async createUploadUrl(request, providerType) {
    const provider = this.getConfiguredProvider(providerType);
    const raw = await provider.createUploadUrl(request);
    return normalizeUploadUrlResult(raw, provider.type);
  }

  /**
   * @param {string} fileId
   * @param {import('./types.js').StorageProviderType} [providerType]
   */
  async deleteFile(fileId, providerType) {
    const provider = this.getConfiguredProvider(providerType);
    await provider.deleteFile(fileId);
  }

  /**
   * @param {{ name: string; parentId?: string }} options
   * @param {import('./types.js').StorageProviderType} [providerType]
   */
  async createFolder(options, providerType) {
    const provider = this.getConfiguredProvider(providerType);
    const raw = await provider.createFolder(options);
    return normalizeStorageFolder(raw, provider.type);
  }

  /**
   * @param {{ parentId?: string; pageToken?: string; pageSize?: number }} [options]
   * @param {import('./types.js').StorageProviderType} [providerType]
   */
  async listFolders(options = {}, providerType) {
    const provider = this.getConfiguredProvider(providerType);
    const raw = await provider.listFolders(options);
    return normalizeFolderList(raw ?? { items: [] }, provider.type);
  }
}
