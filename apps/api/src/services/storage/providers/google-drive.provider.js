import { Readable } from 'node:stream';
import { STORAGE_PROVIDERS } from '@wedding-memory/shared';
import { StorageProvider } from '../storage.interface.js';
import { storageNotConfiguredError } from '../storage.errors.js';
import { badRequestError } from '../../../utils/errors.js';
import { createGoogleDriveClient } from './google-drive.client.js';

/**
 * Google Drive storage provider.
 * Credentials stay on the API server. React never calls the Drive API.
 */
export class GoogleDriveProvider extends StorageProvider {
  /**
   * @param {object} [options]
   * @param {{
   *   clientId?: string;
   *   clientSecret?: string;
   *   refreshToken?: string;
   *   rootFolderId?: string;
   * }} [options.config]
   * @param {ReturnType<typeof createGoogleDriveClient> | null} [options.client]
   */
  constructor({ config = {}, client = null } = {}) {
    super({
      type: STORAGE_PROVIDERS.GOOGLE_DRIVE,
      name: 'Google Drive',
      config: {
        clientId: config.clientId ?? '',
        clientSecret: config.clientSecret ?? '',
        refreshToken: config.refreshToken ?? '',
        rootFolderId: config.rootFolderId ?? '',
      },
    });
    this.client = client;
  }

  getRequiredConfigKeys() {
    return ['clientId', 'clientSecret', 'refreshToken'];
  }

  /**
   * Hot-apply a refresh token without restarting the API.
   * @param {string} refreshToken
   */
  setRefreshToken(refreshToken) {
    this.config.refreshToken = String(refreshToken || '');
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = createGoogleDriveClient({
        clientId: String(this.config.clientId),
        clientSecret: String(this.config.clientSecret),
        refreshToken: String(this.config.refreshToken),
      });
    }
    return this.client;
  }

  /**
   * @param {string | undefined} folderId
   */
  resolveFolderId(folderId) {
    const resolved = folderId || String(this.config.rootFolderId || '');
    if (!resolved) {
      throw storageNotConfiguredError(this.type, ['rootFolderId']);
    }
    return resolved;
  }

  async listFiles(options = {}) {
    this.assertConfigured();
    return this.getClient().listChildren({
      folderId: this.resolveFolderId(options.folderId),
      pageToken: options.pageToken,
      pageSize: options.pageSize ?? 60,
      kind: ['folder', 'image', 'video', 'media'].includes(options.kind) ? options.kind : 'file',
    });
  }

  async getFileMetadata(fileId) {
    this.assertConfigured();
    return this.getClient().getMetadata(fileId);
  }

  async createFolder(options = {}) {
    this.assertConfigured();
    const name = String(options.name || '').trim();
    if (!name) {
      throw badRequestError('Album title is required');
    }
    return this.getClient().createFolder({
      name,
      parentId: this.resolveFolderId(options.parentId),
    });
  }

  /**
   * @param {{ name: string, parentId: string, mimeType: string, body: Buffer }} options
   */
  async uploadFile(options) {
    this.assertConfigured();
    return this.getClient().uploadFile({
      name: options.name,
      parentId: options.parentId,
      mimeType: options.mimeType,
      body: options.body,
    });
  }

  async listFolders(options = {}) {
    this.assertConfigured();
    return this.getClient().listChildren({
      folderId: this.resolveFolderId(options.parentId || options.folderId),
      pageToken: options.pageToken,
      pageSize: options.pageSize ?? 100,
      kind: 'folder',
    });
  }

  /**
   * @param {string} fileId
   * @param {{ range?: string, variant?: 'full' | 'preview' }} [options]
   */
  async openReadStream(fileId, options = {}) {
    this.assertConfigured();
    const downloaded = options.variant === 'preview'
      ? await this.getClient().downloadPreview(fileId)
      : await this.getClient().download(fileId, { range: options.range });
    return {
      stream: downloaded.body ? Readable.fromWeb(downloaded.body) : null,
      statusCode: downloaded.statusCode,
      contentType: downloaded.contentType,
      contentLength: downloaded.contentLength,
      contentRange: downloaded.contentRange,
    };
  }
}
