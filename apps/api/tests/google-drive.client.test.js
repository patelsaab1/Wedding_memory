import { describe, expect, it, vi } from 'vitest';
import { createGoogleDriveClient, resizeThumbnailLink } from '../src/services/storage/providers/google-drive.client.js';
import { AppError } from '../src/utils/errors.js';

describe('Google Drive client', () => {
  it('lists image children with a bearer token and keeps secrets out of the Drive URL', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, options) => {
      calls.push({ url: String(url), options });
      if (String(url).includes('oauth2.googleapis.com')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'ya29.test-token', expires_in: 3600 }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          files: [
            {
              id: 'file1',
              name: 'haldi.jpg',
              mimeType: 'image/jpeg',
              size: '1200',
              parents: ['folder1'],
            },
          ],
        }),
      };
    });

    const client = createGoogleDriveClient({
      clientId: 'client-id',
      clientSecret: 'super-secret-value',
      refreshToken: 'refresh-secret-value',
      fetchImpl,
    });

    const result = await client.listChildren({
      folderId: 'folder1234',
      kind: 'image',
    });

    expect(result.items[0]).toMatchObject({
      id: 'file1',
      name: 'haldi.jpg',
      mimeType: 'image/jpeg',
      size: 1200,
      parentId: 'folder1',
      isFolder: false,
    });

    const driveCall = calls.find((call) => call.url.includes('/drive/v3/files'));
    const query = decodeURIComponent(driveCall.url.replace(/\+/g, ' '));
    expect(query).toContain("mimeType contains 'image/'");
    expect(driveCall.url).not.toContain('super-secret-value');
    expect(driveCall.url).not.toContain('refresh-secret-value');
    expect(driveCall.options.headers.Authorization).toBe('Bearer ya29.test-token');
  });

  it('asks Drive for photos and videos together', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url) => {
      calls.push(String(url));
      if (String(url).includes('oauth2.googleapis.com')) {
        return { ok: true, json: async () => ({ access_token: 'ya29.test-token', expires_in: 3600 }) };
      }
      return { ok: true, json: async () => ({ files: [] }) };
    });

    const client = createGoogleDriveClient({
      clientId: 'client-id',
      clientSecret: 'secret',
      refreshToken: 'refresh',
      fetchImpl,
    });

    await client.listChildren({ folderId: 'folder1234', kind: 'media' });

    const query = decodeURIComponent(calls.find((url) => url.includes('/drive/v3/files')).replace(/\+/g, ' '));
    expect(query).toContain("mimeType contains 'video/'");
    expect(query).toContain("mimeType contains 'image/'");
  });

  it('forwards a Range header when downloading a film', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, options) => {
      calls.push({ url: String(url), options });
      if (String(url).includes('oauth2.googleapis.com')) {
        return { ok: true, json: async () => ({ access_token: 'ya29.test-token', expires_in: 3600 }) };
      }
      return {
        ok: true,
        status: 206,
        body: { cancel() {} },
        headers: {
          get(name) {
            const headers = {
              'content-type': 'video/mp4',
              'content-length': '4',
              'content-range': 'bytes 0-3/9',
            };
            return headers[name] ?? null;
          },
        },
      };
    });

    const client = createGoogleDriveClient({
      clientId: 'client-id',
      clientSecret: 'secret',
      refreshToken: 'refresh',
      fetchImpl,
    });

    const file = await client.download('file123456', { range: 'bytes=0-3' });
    const download = calls.find((call) => call.url.includes('alt=media'));

    expect(download.options.headers.Range).toBe('bytes=0-3');
    expect(download.options.headers.Authorization).toBe('Bearer ya29.test-token');
    expect(file).toMatchObject({
      statusCode: 206,
      contentType: 'video/mp4',
      contentRange: 'bytes 0-3/9',
    });
  });

  it('resizes a Google thumbnail and ignores other hosts', () => {
    expect(resizeThumbnailLink('https://lh3.googleusercontent.com/d/file123456=s220')).toBe(
      'https://lh3.googleusercontent.com/d/file123456=s960',
    );
    expect(resizeThumbnailLink('https://evil.example/d/file123456=s220')).toBeNull();
  });

  it('downloads a thumbnail for scroll previews', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url) => {
      calls.push(String(url));
      if (String(url).includes('oauth2.googleapis.com')) {
        return { ok: true, json: async () => ({ access_token: 'ya29.test-token', expires_in: 3600 }) };
      }
      if (String(url).includes('fields=thumbnailLink')) {
        return {
          ok: true,
          json: async () => ({ thumbnailLink: 'https://lh3.googleusercontent.com/d/file123456=s220' }),
        };
      }
      return {
        ok: true,
        status: 200,
        body: { cancel() {} },
        headers: { get: () => 'image/jpeg' },
      };
    });

    const client = createGoogleDriveClient({
      clientId: 'client-id',
      clientSecret: 'secret',
      refreshToken: 'refresh',
      fetchImpl,
    });

    const file = await client.downloadPreview('file123456');
    expect(calls.some((url) => url.includes('=s960'))).toBe(true);
    expect(calls.some((url) => url.includes('alt=media'))).toBe(false);
    expect(file).toMatchObject({ statusCode: 200, contentType: 'image/jpeg' });
  });

  it('rejects an invalid folder id before calling Google', async () => {
    const fetchImpl = vi.fn();
    const client = createGoogleDriveClient({
      clientId: 'client-id',
      clientSecret: 'secret',
      refreshToken: 'refresh',
      fetchImpl,
    });

    await expect(client.listChildren({ folderId: 'bad id' })).rejects.toBeInstanceOf(AppError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
