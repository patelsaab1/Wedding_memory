import { apiClient } from '@/lib/api-client';

export async function fetchDriveStatus() {
  const { data } = await apiClient.get('/storage/google/status');
  return data;
}

export async function refreshDriveToken() {
  const { data } = await apiClient.post('/storage/google/refresh');
  return data;
}

export function startDriveTokenUpdate() {
  window.location.assign('/api/v1/storage/google/connect');
}
