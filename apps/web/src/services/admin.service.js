import { apiClient } from '@/lib/api-client';

export async function getHomeSections() {
  const response = await apiClient.get('/website/home');
  return response.data.data;
}

export async function getAdminSections() {
  const response = await apiClient.get('/admin/sections');
  return response.data.data;
}

/**
 * @param {string} key
 * @param {{ title: string, eyebrow: string, description: string, enabled: boolean }} section
 */
export async function saveAdminSection(key, section) {
  const response = await apiClient.patch(`/admin/sections/${encodeURIComponent(key)}`, section);
  return response.data.data;
}

/**
 * @param {string[]} keys
 */
export async function reorderAdminSections(keys) {
  const response = await apiClient.put('/admin/sections/order', { keys });
  return response.data.data;
}

export async function getGuestLogins() {
  const response = await apiClient.get('/admin/guests');
  return response.data.data;
}

/**
 * @param {{ name: string, email: string, role: string, activeDays: number }} guest
 */
export async function createGuestLogin(guest) {
  const response = await apiClient.post('/admin/guests', guest);
  return response.data.data;
}

/**
 * @param {string} userId
 */
export async function endGuestLogin(userId) {
  const response = await apiClient.patch(`/admin/guests/${encodeURIComponent(userId)}`);
  return response.data.data;
}

export async function getAdminFolders() {
  const response = await apiClient.get('/admin/folders');
  return response.data.data;
}

export async function getAlbumAccess() {
  const response = await apiClient.get('/admin/album-access');
  return response.data.data;
}

/**
 * @param {string} folderId
 * @param {{ secret: boolean, memberIds: string[] }} access
 */
export async function saveAlbumAccess(folderId, access) {
  const response = await apiClient.put(`/admin/folders/${encodeURIComponent(folderId)}/access`, access);
  return response.data.data;
}

/**
 * @param {string} title
 */
export async function createAdminAlbum(title) {
  const response = await apiClient.post('/admin/albums', { title });
  return response.data.data;
}

/**
 * @param {string} folderId
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 */
export async function uploadAdminFile(folderId, file, onProgress) {
  const body = new FormData();
  body.append('file', file);
  const response = await apiClient.post(`/admin/folders/${encodeURIComponent(folderId)}/files`, body, {
    timeout: 120_000,
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    },
    transformRequest: [
      (data, headers) => {
        delete headers['Content-Type'];
        return data;
      },
    ],
  });
  return response.data.data;
}
