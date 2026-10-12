import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      PORT: '4001',
      CORS_ORIGIN: 'http://localhost:5173',
      JWT_ACCESS_SECRET: 'test-access-secret-must-be-32-chars!!',
      JWT_REFRESH_SECRET: 'test-refresh-secret-must-be-32-chars!',
      BCRYPT_ROUNDS: '10',
      AUTH_COOKIE_SECURE: 'false',
    },
  },
});
