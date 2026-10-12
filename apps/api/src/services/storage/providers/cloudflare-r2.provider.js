import { STORAGE_PROVIDERS } from '@wedding-memory/shared';
import { StorageProvider } from '../storage.interface.js';

/**
 * Cloudflare R2 storage provider.
 *
 * Access keys stay on the API server only — never send to React.
 * Presigned URL generation will be wired in a later phase.
 */
export class CloudflareR2Provider extends StorageProvider {
  /**
   * @param {object} [options]
   * @param {{
   *   accountId?: string;
   *   accessKeyId?: string;
   *   secretAccessKey?: string;
   *   bucketName?: string;
   *   endpoint?: string;
   *   publicBaseUrl?: string;
   * }} [options.config]
   */
  constructor({ config = {} } = {}) {
    super({
      type: STORAGE_PROVIDERS.R2,
      name: 'Cloudflare R2',
      config: {
        accountId: config.accountId ?? '',
        accessKeyId: config.accessKeyId ?? '',
        secretAccessKey: config.secretAccessKey ?? '',
        bucketName: config.bucketName ?? '',
        endpoint: config.endpoint ?? '',
        publicBaseUrl: config.publicBaseUrl ?? '',
      },
    });
  }

  getRequiredConfigKeys() {
    return ['accountId', 'accessKeyId', 'secretAccessKey', 'bucketName', 'endpoint'];
  }

  async listFiles() {
    return this.assertOperationReady('listFiles');
  }

  async getFileMetadata() {
    return this.assertOperationReady('getFileMetadata');
  }

  async getPreviewUrl() {
    return this.assertOperationReady('getPreviewUrl');
  }

  async getDownloadUrl() {
    return this.assertOperationReady('getDownloadUrl');
  }

  async createUploadUrl() {
    return this.assertOperationReady('createUploadUrl');
  }

  async deleteFile() {
    return this.assertOperationReady('deleteFile');
  }

  async createFolder() {
    return this.assertOperationReady('createFolder');
  }

  async listFolders() {
    return this.assertOperationReady('listFolders');
  }
}
