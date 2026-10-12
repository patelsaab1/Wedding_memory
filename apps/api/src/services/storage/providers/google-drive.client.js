import { badRequestError } from '../../../utils/errors.js';
import { storageProviderError } from '../storage.errors.js';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const PREVIEW_SIZE = 960;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const DRIVE_ID = /^[a-zA-Z0-9_-]{8,128}$/;

/**
 * @param {unknown} value
 * @param {string} [label]
 */
export function assertDriveId(value, label = 'id') {
  if (typeof value !== 'string' || !DRIVE_ID.test(value)) {
    throw badRequestError(`Invalid Google Drive ${label}`);
  }
  return value;
}

/**
 * @param {Record<string, unknown>} file
 */
/**
 * Point a Drive thumbnail at a scroll-sized image. Rejects any host that is not Google.
 * @param {unknown} link
 * @param {number} [size]
 */
export function resizeThumbnailLink(link, size = PREVIEW_SIZE) {
  if (typeof link !== 'string' || !link.startsWith('https://')) return null;
  let parsed;
  try {
    parsed = new URL(link);
  } catch {
    return null;
  }
  if (!/(^|\.)googleusercontent\.com$|(^|\.)googleapis\.com$/.test(parsed.hostname)) {
    return null;
  }

  const width = String(Math.min(Math.max(Number(size) || PREVIEW_SIZE, 200), 1600));
  if (/=s\d+$/.test(link)) return link.replace(/=s\d+$/, `=s${width}`);
  if (/=w\d+(-h\d+)?$/.test(link)) return link.replace(/=w\d+(-h\d+)?$/, `=w${width}`);
  return link;
}

function mapDriveFile(file) {
  const parents = Array.isArray(file.parents) ? file.parents : [];
  const id = String(file.id ?? '');
  return {
    id,
    name: String(file.name ?? id),
    mimeType: typeof file.mimeType === 'string' ? file.mimeType : 'application/octet-stream',
    size: file.size === undefined || file.size === null ? null : Number(file.size),
    parentId: parents[0] ? String(parents[0]) : null,
    providerFileId: id,
    isFolder: file.mimeType === FOLDER_MIME,
    createdAt: typeof file.createdTime === 'string' ? file.createdTime : null,
    updatedAt: typeof file.modifiedTime === 'string' ? file.modifiedTime : null,
  };
}

/**
 * Server-side Google Drive REST client.
 * Tokens stay in memory on the API process and are never returned to React.
 *
 * @param {object} options
 * @param {string} options.clientId
 * @param {string} options.clientSecret
 * @param {string} options.refreshToken
 * @param {typeof fetch} [options.fetchImpl]
 */
export function createGoogleDriveClient({ clientId, clientSecret, refreshToken, fetchImpl = fetch }) {
  /** @type {{ accessToken: string, expiresAt: number } | null} */
  let token = null;

  async function authorize() {
    if (token && token.expiresAt > Date.now() + 30_000) {
      return token.accessToken;
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw storageProviderError(
        'google_drive',
        'Google Drive authorization failed. Check the server Drive credentials.',
      );
    }

    const payload = await response.json();
    if (!payload?.access_token || typeof payload.access_token !== 'string') {
      throw storageProviderError('google_drive', 'Google Drive did not return an access token.');
    }

    const expiresIn = Number(payload.expires_in) || 3600;
    token = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    return token.accessToken;
  }

  /**
   * @param {string} pathAndQuery
   * @param {{ json?: boolean }} [options]
   */
  async function driveRequest(pathAndQuery, { json = true } = {}) {
    const accessToken = await authorize();
    const response = await fetchImpl(`${DRIVE_API}/${pathAndQuery}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw storageProviderError(
        'google_drive',
        `Google Drive request failed (${response.status}).`,
      );
    }

    if (!json) {
      return response;
    }

    return response.json();
  }

  return {
    /**
     * @param {{ folderId: string, pageToken?: string, pageSize?: number, kind?: 'file' | 'folder' | 'image' | 'video' | 'media' }} options
     */
    async listChildren({ folderId, pageToken, pageSize = 60, kind = 'file' }) {
      const parentId = assertDriveId(folderId, 'folder id');
      const clauses = [`'${parentId}' in parents`, 'trashed = false'];

      if (kind === 'folder') {
        clauses.push(`mimeType = '${FOLDER_MIME}'`);
      } else if (kind === 'image') {
        clauses.push("mimeType contains 'image/'");
      } else if (kind === 'video') {
        clauses.push("mimeType contains 'video/'");
      } else if (kind === 'media') {
        clauses.push("(mimeType contains 'image/' or mimeType contains 'video/')");
      } else {
        clauses.push(`mimeType != '${FOLDER_MIME}'`);
      }

      const params = new URLSearchParams({
        q: clauses.join(' and '),
        fields: 'nextPageToken,files(id,name,mimeType,size,parents,createdTime,modifiedTime)',
        pageSize: String(Math.min(Math.max(Number(pageSize) || 60, 1), 100)),
        orderBy: 'name',
      });

      if (pageToken) {
        params.set('pageToken', String(pageToken));
      }

      const payload = await driveRequest(`files?${params.toString()}`);
      const files = Array.isArray(payload?.files) ? payload.files : [];

      return {
        items: files.map((file) => mapDriveFile(file)),
        nextPageToken: payload?.nextPageToken ? String(payload.nextPageToken) : null,
      };
    },

    /**
     * @param {string} fileId
     */
    async getMetadata(fileId) {
      const id = assertDriveId(fileId, 'file id');
      const params = new URLSearchParams({
        fields: 'id,name,mimeType,size,parents,createdTime,modifiedTime',
      });
      const payload = await driveRequest(`files/${id}?${params.toString()}`);
      return mapDriveFile(payload ?? { id });
    },

    /**
     * @param {string} fileId
     * @param {{ range?: string }} [options]
     */
    async download(fileId, { range } = {}) {
      const id = assertDriveId(fileId, 'file id');
      const accessToken = await authorize();
      /** @type {Record<string, string>} */
      const headers = { Authorization: `Bearer ${accessToken}` };
      if (range) {
        headers.Range = range;
      }

      const response = await fetchImpl(`${DRIVE_API}/files/${id}?alt=media`, { headers });

      if (response.status === 416) {
        return {
          body: null,
          statusCode: 416,
          contentType: response.headers?.get?.('content-type') || 'application/octet-stream',
          contentLength: null,
          contentRange: response.headers?.get?.('content-range') || null,
        };
      }

      if (!response.ok) {
        throw storageProviderError(
          'google_drive',
          `Google Drive request failed (${response.status}).`,
        );
      }

      if (!response.body) {
        throw storageProviderError('google_drive', 'Google Drive returned an empty file.');
      }

      const lengthHeader = response.headers?.get?.('content-length');
      const contentLength = lengthHeader ? Number(lengthHeader) : null;

      return {
        body: response.body,
        statusCode: response.status,
        contentType: response.headers?.get?.('content-type') || 'application/octet-stream',
        contentLength: Number.isFinite(contentLength) ? contentLength : null,
        contentRange: response.headers?.get?.('content-range') || null,
      };
    },

    /**
     * A smaller image for scrolling. Falls back to the original file when Drive has no thumbnail.
     * @param {string} fileId
     */
    async downloadPreview(fileId) {
      const id = assertDriveId(fileId, 'file id');
      const accessToken = await authorize();
      const meta = await driveRequest(`files/${id}?fields=thumbnailLink`);
      const thumb = resizeThumbnailLink(meta?.thumbnailLink);

      if (!thumb) {
        return this.download(fileId);
      }

      const response = await fetchImpl(thumb, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok || !response.body) {
        return this.download(fileId);
      }

      const lengthHeader = response.headers?.get?.('content-length');
      const contentLength = lengthHeader ? Number(lengthHeader) : null;

      return {
        body: response.body,
        statusCode: 200,
        contentType: response.headers?.get?.('content-type') || 'image/jpeg',
        contentLength: Number.isFinite(contentLength) ? contentLength : null,
        contentRange: null,
      };
    },

    /**
     * @param {{ name: string, parentId: string }} options
     */
    async createFolder({ name, parentId }) {
      const parent = assertDriveId(parentId, 'folder id');
      const accessToken = await authorize();
      const response = await fetchImpl(`${DRIVE_API}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          mimeType: FOLDER_MIME,
          parents: [parent],
        }),
      });

      if (!response.ok) {
        throw storageProviderError(
          'google_drive',
          'Google Drive could not create the album folder.',
        );
      }

      const payload = await response.json();
      return mapDriveFile(payload ?? {});
    },

    /**
     * @param {{ name: string, parentId: string, mimeType: string, body: Buffer }} options
     */
    async uploadFile({ name, parentId, mimeType, body }) {
      const parent = assertDriveId(parentId, 'folder id');
      const accessToken = await authorize();
      const boundary = `weddingmemory${Date.now()}`;
      const meta = JSON.stringify({ name, parents: [parent] });
      const preamble = Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      );
      const ending = Buffer.from(`\r\n--${boundary}--`);
      const payload = Buffer.concat([preamble, body, ending]);

      const response = await fetchImpl(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,parents',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: payload,
        },
      );

      if (!response.ok) {
        throw storageProviderError(
          'google_drive',
          'Google Drive could not store that photo or film.',
        );
      }

      const created = await response.json();
      return mapDriveFile(created ?? {});
    },
  };
}
