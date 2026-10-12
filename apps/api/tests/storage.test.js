import { describe, expect, it, vi } from 'vitest';
import { STORAGE_PROVIDERS } from '@wedding-memory/shared';
import { StorageManager } from '../src/services/storage/storage-manager.js';
import { StorageProvider } from '../src/services/storage/storage.interface.js';
import { GoogleDriveProvider } from '../src/services/storage/providers/google-drive.provider.js';
import { CloudflareR2Provider } from '../src/services/storage/providers/cloudflare-r2.provider.js';
import { createStorageManager } from '../src/services/storage/create-storage-manager.js';
import {
  normalizeStorageFile,
  normalizeUploadUrlResult,
} from '../src/services/storage/normalize.js';
import { AppError } from '../src/utils/errors.js';

/**
 * In-memory provider used only in unit tests to verify delegation/normalization.
 * Not a production Drive/R2 mock API.
 */
class StubProvider extends StorageProvider {
  /**
   * @param {object} options
   * @param {import('../src/services/storage/types.js').StorageProviderType} options.type
   * @param {boolean} [options.configured]
   */
  constructor({ type, configured = true }) {
    super({
      type,
      name: `stub:${type}`,
      config: configured ? { ready: 'yes' } : {},
    });
    this.calls = [];
  }

  getRequiredConfigKeys() {
    return this.config.ready ? [] : ['ready'];
  }

  async listFiles(options = {}) {
    this.assertConfigured();
    this.calls.push(['listFiles', options]);
    return {
      items: [
        {
          id: 'file-1',
          fileName: 'ceremony.jpg',
          mimeType: 'image/jpeg',
          fileSize: 2048,
          folderId: options.folderId ?? 'root',
        },
      ],
      nextPageToken: null,
    };
  }

  async getFileMetadata(fileId) {
    this.assertConfigured();
    this.calls.push(['getFileMetadata', fileId]);
    return {
      id: fileId,
      name: 'ceremony.jpg',
      mimeType: 'image/jpeg',
      size: 2048,
    };
  }

  async getPreviewUrl(fileId) {
    this.assertConfigured();
    this.calls.push(['getPreviewUrl', fileId]);
    return { previewUrl: `https://example.test/preview/${fileId}`, expiresInSeconds: 60 };
  }

  async getDownloadUrl(request) {
    this.assertConfigured();
    this.calls.push(['getDownloadUrl', request]);
    return {
      downloadUrl: `https://example.test/download/${request.fileId}`,
      expiresInSeconds: 120,
    };
  }

  async createUploadUrl(request) {
    this.assertConfigured();
    this.calls.push(['createUploadUrl', request]);
    return {
      uploadUrl: 'https://example.test/upload',
      storageKey: request.storageKey ?? `uploads/${request.fileName}`,
      providerFileId: 'upload-1',
      method: 'PUT',
      headers: { 'Content-Type': request.mimeType },
      expiresInSeconds: 300,
    };
  }

  async deleteFile(fileId) {
    this.assertConfigured();
    this.calls.push(['deleteFile', fileId]);
  }

  async createFolder(options) {
    this.assertConfigured();
    this.calls.push(['createFolder', options]);
    return {
      id: 'folder-1',
      name: options.name,
      parentId: options.parentId ?? null,
    };
  }

  async listFolders(options = {}) {
    this.assertConfigured();
    this.calls.push(['listFolders', options]);
    return {
      items: [{ id: 'folder-1', name: 'Wedding', parentId: options.parentId ?? null }],
      nextPageToken: null,
    };
  }
}

function createTestManager({
  defaultProvider = STORAGE_PROVIDERS.R2,
  driveConfigured = true,
  r2Configured = true,
} = {}) {
  const drive = new StubProvider({
    type: STORAGE_PROVIDERS.GOOGLE_DRIVE,
    configured: driveConfigured,
  });
  const r2 = new StubProvider({
    type: STORAGE_PROVIDERS.R2,
    configured: r2Configured,
  });

  const manager = new StorageManager({
    defaultProvider,
    providers: new Map([
      [STORAGE_PROVIDERS.GOOGLE_DRIVE, drive],
      [STORAGE_PROVIDERS.R2, r2],
    ]),
  });

  return { manager, drive, r2 };
}

describe('storage abstraction', () => {
  describe('provider selection', () => {
    it('selects the default provider', () => {
      const { manager, r2 } = createTestManager({
        defaultProvider: STORAGE_PROVIDERS.R2,
      });

      expect(manager.getProvider().type).toBe(STORAGE_PROVIDERS.R2);
      expect(manager.getProvider()).toBe(r2);
    });

    it('selects an explicit provider when requested', () => {
      const { manager, drive } = createTestManager({
        defaultProvider: STORAGE_PROVIDERS.R2,
      });

      expect(manager.getProvider(STORAGE_PROVIDERS.GOOGLE_DRIVE)).toBe(drive);
    });
  });

  describe('invalid provider', () => {
    it('rejects an unknown provider type on construction', () => {
      expect(
        () =>
          new StorageManager({
            defaultProvider: /** @type {any} */ ('s3'),
            providers: new Map([
              [
                STORAGE_PROVIDERS.R2,
                new StubProvider({ type: STORAGE_PROVIDERS.R2 }),
              ],
            ]),
          }),
      ).toThrow(AppError);

      try {
        new StorageManager({
          defaultProvider: /** @type {any} */ ('s3'),
          providers: new Map([
            [STORAGE_PROVIDERS.R2, new StubProvider({ type: STORAGE_PROVIDERS.R2 })],
          ]),
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.code).toBe('STORAGE_INVALID_PROVIDER');
      }
    });

    it('rejects getProvider for an unregistered type', () => {
      const { manager } = createTestManager();

      expect(() => manager.getProvider(/** @type {any} */ ('dropbox'))).toThrow(AppError);

      try {
        manager.getProvider(/** @type {any} */ ('dropbox'));
      } catch (error) {
        expect(error.code).toBe('STORAGE_INVALID_PROVIDER');
      }
    });
  });

  describe('configuration validation', () => {
    it('reports missing Google Drive and R2 configuration clearly', () => {
      const manager = createStorageManager({
        storage: {
          defaultProvider: STORAGE_PROVIDERS.GOOGLE_DRIVE,
          googleDrive: {},
          r2: {},
        },
      });

      const status = manager.getStatus();

      expect(status.defaultProvider).toBe(STORAGE_PROVIDERS.GOOGLE_DRIVE);
      expect(status.providers.google_drive.configured).toBe(false);
      expect(status.providers.google_drive.missing).toEqual(
        expect.arrayContaining(['clientId', 'clientSecret', 'refreshToken']),
      );
      expect(status.providers.r2.configured).toBe(false);
      expect(status.providers.r2.missing).toEqual(
        expect.arrayContaining([
          'accountId',
          'accessKeyId',
          'secretAccessKey',
          'bucketName',
          'endpoint',
        ]),
      );
      // Public status must never include credential values — only key names in `missing`.
      expect(Object.keys(status.providers.google_drive).sort()).toEqual([
        'configured',
        'message',
        'missing',
        'type',
      ]);
      expect(status.providers.google_drive.message).toContain('Missing configuration');
    });

    it('throws STORAGE_NOT_CONFIGURED when operating without credentials', async () => {
      const drive = new GoogleDriveProvider({ config: {} });
      const r2 = new CloudflareR2Provider({ config: {} });
      const manager = new StorageManager({
        defaultProvider: STORAGE_PROVIDERS.GOOGLE_DRIVE,
        providers: new Map([
          [STORAGE_PROVIDERS.GOOGLE_DRIVE, drive],
          [STORAGE_PROVIDERS.R2, r2],
        ]),
      });

      await expect(manager.listFiles()).rejects.toMatchObject({
        code: 'STORAGE_NOT_CONFIGURED',
        statusCode: 503,
      });
    });

    it('reports a missing Drive root folder before calling Google', async () => {
      const drive = new GoogleDriveProvider({
        config: {
          clientId: 'id',
          clientSecret: 'secret',
          refreshToken: 'refresh',
        },
      });

      await expect(drive.listFiles()).rejects.toMatchObject({
        code: 'STORAGE_NOT_CONFIGURED',
        details: { missing: ['rootFolderId'] },
      });
    });

    it('lists files through the injected Drive client when configured', async () => {
      const client = {
        listChildren: vi.fn().mockResolvedValue({
          items: [
            {
              id: 'photo1',
              name: 'haldi.jpg',
              mimeType: 'image/jpeg',
              size: 20,
              parentId: 'haldi-folder',
              isFolder: false,
            },
          ],
          nextPageToken: null,
        }),
      };
      const drive = new GoogleDriveProvider({
        config: {
          clientId: 'id',
          clientSecret: 'secret',
          refreshToken: 'refresh',
          rootFolderId: 'photos-root',
        },
        client,
      });

      const result = await drive.listFiles({ folderId: 'photos-root', kind: 'image' });

      expect(client.listChildren).toHaveBeenCalledWith(
        expect.objectContaining({ folderId: 'photos-root', kind: 'image' }),
      );
      expect(result.items[0].name).toBe('haldi.jpg');
    });
  });

  describe('normalized response', () => {
    it('normalizes provider-specific file payloads into StorageFile', () => {
      const file = normalizeStorageFile(
        {
          id: 'drv-9',
          fileName: 'vow.mp4',
          mimeType: 'video/mp4',
          fileSize: '4096',
          folderId: 'albums',
          createdTime: '2026-01-01T00:00:00.000Z',
        },
        STORAGE_PROVIDERS.GOOGLE_DRIVE,
      );

      expect(file).toEqual({
        id: 'drv-9',
        name: 'vow.mp4',
        mimeType: 'video/mp4',
        size: 4096,
        provider: STORAGE_PROVIDERS.GOOGLE_DRIVE,
        providerFileId: 'drv-9',
        storageKey: null,
        parentId: 'albums',
        isFolder: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: null,
      });
    });

    it('normalizes upload URL results', () => {
      const result = normalizeUploadUrlResult(
        {
          uploadUrl: 'https://example.test/put',
          key: 'media/a.jpg',
          id: 'obj-1',
          expiresInSeconds: 90,
        },
        STORAGE_PROVIDERS.R2,
      );

      expect(result).toEqual({
        uploadUrl: 'https://example.test/put',
        provider: STORAGE_PROVIDERS.R2,
        storageKey: 'media/a.jpg',
        providerFileId: 'obj-1',
        method: 'PUT',
        headers: {},
        expiresInSeconds: 90,
      });
    });
  });

  describe('storage manager delegation', () => {
    it('delegates listFiles and returns normalized StorageFile items', async () => {
      const { manager, r2 } = createTestManager({
        defaultProvider: STORAGE_PROVIDERS.R2,
      });

      const result = await manager.listFiles({ folderId: 'root' });

      expect(r2.calls).toEqual([['listFiles', { folderId: 'root' }]]);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: 'file-1',
        name: 'ceremony.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        provider: STORAGE_PROVIDERS.R2,
        parentId: 'root',
        isFolder: false,
      });
    });

    it('delegates createUploadUrl to the selected provider', async () => {
      const { manager, drive } = createTestManager({
        defaultProvider: STORAGE_PROVIDERS.R2,
      });

      const result = await manager.createUploadUrl(
        {
          fileName: 'ring.jpg',
          mimeType: 'image/jpeg',
          storageKey: 'uploads/ring.jpg',
        },
        STORAGE_PROVIDERS.GOOGLE_DRIVE,
      );

      expect(drive.calls[0][0]).toBe('createUploadUrl');
      expect(result).toMatchObject({
        uploadUrl: 'https://example.test/upload',
        provider: STORAGE_PROVIDERS.GOOGLE_DRIVE,
        storageKey: 'uploads/ring.jpg',
        providerFileId: 'upload-1',
        method: 'PUT',
        expiresInSeconds: 300,
      });
    });

    it('delegates deleteFile without leaking provider SDKs', async () => {
      const { manager, r2 } = createTestManager();
      const spy = vi.spyOn(r2, 'deleteFile');

      await manager.deleteFile('file-99');

      expect(spy).toHaveBeenCalledWith('file-99');
      expect(r2.calls).toEqual([['deleteFile', 'file-99']]);
    });
  });
});
