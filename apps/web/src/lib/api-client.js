import axios from 'axios';
import { appConfig } from '@/config';
import { getCsrfToken } from '@/lib/cookies';

/**
 * Shared Axios instance for API calls.
 * Sends cookies (HTTP-only JWT) and CSRF header on mutating requests.
 */
export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});

let refreshPromise = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh')
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        await refreshSession();
        return apiClient(original);
      } catch {
        // fall through
      }
    }

    const message = error.response?.data?.error?.message || error.message || 'Request failed';
    const enriched = new Error(message);
    enriched.status = status;
    enriched.code = error.response?.data?.error?.code;
    return Promise.reject(enriched);
  },
);
