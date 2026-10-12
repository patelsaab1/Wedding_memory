import { apiClient } from '@/lib/api-client';

export async function loginRequest(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data.data.user;
}

export async function logoutRequest() {
  const { data } = await apiClient.post('/auth/logout');
  return data.data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.data;
}

export async function refreshRequest() {
  const { data } = await apiClient.post('/auth/refresh');
  return data.data.user;
}
