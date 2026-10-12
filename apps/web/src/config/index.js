export const appConfig = Object.freeze({
  appName: import.meta.env.VITE_APP_NAME || 'Wedding Memory',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
});
