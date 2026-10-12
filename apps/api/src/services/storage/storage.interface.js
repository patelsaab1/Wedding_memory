import {
  storageNotConfiguredError,
  storageOperationUnavailableError,
} from './storage.errors.js';

/**
 * Provider-independent storage contract.
 *
 * Controllers → StorageManager → StorageProvider → GoogleDrive / Cloudflare R2
 *
 * Concrete providers must implement every method below.
 * Do not call Google Drive or Cloudflare R2 SDKs from controllers or React.
 *
 * @typedef {import('./types.js').StorageProviderType} StorageProviderType
 * @typedef {import('./types.js').StorageUploadRequest} StorageUploadRequest
 * @typedef {import('./types.js').StorageDownloadRequest} StorageDownloadRequest
 * @typedef {import('./types.js').StorageProviderConfigStatus} StorageProviderConfigStatus
 */

export class StorageProvider {
  /**
   * @param {object} [options]
   * @param {StorageProviderType} options.type
   * @param {string} [options.name]
   * @param {Record<string, unknown>} [options.config]
   */
  constructor({ type, name, config = {} } = {}) {
    if (!type) {
      throw new TypeError('StorageProvider requires a type');
    }

    /** @type {StorageProviderType} */
    this.type = type;
    /** @type {string} */
    this.name = name ?? type;
    /** @type {Record<string, unknown>} */
    this.config = config;
  }

  /**
   * Required configuration keys for this provider (server-side only).
   * @returns {string[]}
   */
  getRequiredConfigKeys() {
    return [];
  }

  /**
   * @returns {StorageProviderConfigStatus}
   */
  getConfigStatus() {
    const required = this.getRequiredConfigKeys();
    const missing = required.filter((key) => {
      const value = this.config[key];
      return value === undefined || value === null || value === '';
    });

    return {
      type: this.type,
      configured: missing.length === 0,
      missing,
      message:
        missing.length === 0
          ? null
          : `Missing configuration for "${this.type}": ${missing.join(', ')}`,
    };
  }

  /**
   * @returns {boolean}
   */
  isConfigured() {
    return this.getConfigStatus().configured;
  }

  /**
   * Throws STORAGE_NOT_CONFIGURED when required env/config is missing.
   */
  assertConfigured() {
    const status = this.getConfigStatus();
    if (!status.configured) {
      throw storageNotConfiguredError(this.type, status.missing);
    }
  }

  /**
   * Used when credentials exist but cloud SDK wiring is not active yet.
   * @param {string} operation
   */
  assertOperationReady(operation) {
    this.assertConfigured();
    throw storageOperationUnavailableError(this.type, operation);
  }

  /**
   * @param {{ folderId?: string; pageToken?: string; pageSize?: number }} [_options]
   * @returns {Promise<{ items: Record<string, unknown>[]; nextPageToken?: string | null }>}
   */
  async listFiles(_options = {}) {
    this.assertOperationReady('listFiles');
  }

  /**
   * @param {string} _fileId
   * @returns {Promise<Record<string, unknown>>}
   */
  async getFileMetadata(_fileId) {
    this.assertOperationReady('getFileMetadata');
  }

  /**
   * @param {string} _fileId
   * @param {Record<string, unknown>} [_options]
   * @returns {Promise<string | { previewUrl?: string; url?: string; expiresInSeconds?: number }>}
   */
  async getPreviewUrl(_fileId, _options = {}) {
    this.assertOperationReady('getPreviewUrl');
  }

  /**
   * @param {StorageDownloadRequest} _request
   * @returns {Promise<string | { downloadUrl?: string; url?: string; expiresInSeconds?: number }>}
   */
  async getDownloadUrl(_request) {
    this.assertOperationReady('getDownloadUrl');
  }

  /**
   * @param {StorageUploadRequest} _request
   * @returns {Promise<Record<string, unknown>>}
   */
  async createUploadUrl(_request) {
    this.assertOperationReady('createUploadUrl');
  }

  /**
   * @param {string} _fileId
   * @returns {Promise<void>}
   */
  async deleteFile(_fileId) {
    this.assertOperationReady('deleteFile');
  }

  /**
   * @param {{ name: string; parentId?: string }} _options
   * @returns {Promise<Record<string, unknown>>}
   */
  async createFolder(_options) {
    this.assertOperationReady('createFolder');
  }

  /**
   * @param {{ parentId?: string; pageToken?: string; pageSize?: number }} [_options]
   * @returns {Promise<{ items: Record<string, unknown>[]; nextPageToken?: string | null }>}
   */
  async listFolders(_options = {}) {
    this.assertOperationReady('listFolders');
  }

  /**
   * Stream file bytes. Used by the API so the browser never talks to the provider.
   * @param {string} _fileId
   * @returns {Promise<{ stream: import('node:stream').Readable, contentType: string, contentLength: number | null }>}
   */
  async openReadStream(_fileId) {
    this.assertOperationReady('openReadStream');
  }
}
