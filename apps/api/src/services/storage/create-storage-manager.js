import { STORAGE_PROVIDERS } from '@wedding-memory/shared';
import { StorageManager } from './storage-manager.js';
import { GoogleDriveProvider } from './providers/google-drive.provider.js';
import { CloudflareR2Provider } from './providers/cloudflare-r2.provider.js';
import { isStorageProviderType } from './types.js';

/**
 * Build the default StorageManager from application config.
 * Secrets remain server-side; nothing here is safe to send to the frontend.
 *
 * @param {{ storage: {
 *   defaultProvider: import('./types.js').StorageProviderType;
 *   googleDrive: {
 *     clientId?: string;
 *     clientSecret?: string;
 *     refreshToken?: string;
 *     rootFolderId?: string;
 *   };
 *   r2: {
 *     accountId?: string;
 *     accessKeyId?: string;
 *     secretAccessKey?: string;
 *     bucketName?: string;
 *     endpoint?: string;
 *     publicBaseUrl?: string;
 *   };
 * } }} appConfig
 * @returns {StorageManager}
 */
export function createStorageManager(appConfig) {
  const storageConfig = appConfig.storage;
  const defaultProvider = isStorageProviderType(storageConfig.defaultProvider)
    ? storageConfig.defaultProvider
    : STORAGE_PROVIDERS.GOOGLE_DRIVE;

  const providers = new Map([
    [
      STORAGE_PROVIDERS.GOOGLE_DRIVE,
      new GoogleDriveProvider({ config: storageConfig.googleDrive }),
    ],
    [STORAGE_PROVIDERS.R2, new CloudflareR2Provider({ config: storageConfig.r2 })],
  ]);

  return new StorageManager({
    defaultProvider,
    providers,
  });
}
