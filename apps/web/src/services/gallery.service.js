import { apiClient } from '@/lib/api-client';

export async function getGallery() {
  const response = await apiClient.get('/gallery');
  return response.data.data;
}

/**
 * @param {string} folderId
 */
export async function getGalleryAlbum(folderId) {
  const response = await apiClient.get(`/gallery/albums/${encodeURIComponent(folderId)}`);
  return response.data.data;
}
