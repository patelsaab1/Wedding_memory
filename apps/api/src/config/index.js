import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(apiRoot, '.env') });

const optionalSecret = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/wedding_memory'),
  JWT_ACCESS_SECRET: z.string().min(32).default('dev-access-secret-change-me-32chars!!'),
  JWT_REFRESH_SECRET: z.string().min(32).default('dev-refresh-secret-change-me-32chars!'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  AUTH_COOKIE_SECURE: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (typeof value === 'boolean') return value;
      return value === 'true';
    }),
  /** Active storage backend for new writes when multiple providers exist. */
  STORAGE_DEFAULT_PROVIDER: z.enum(['google_drive', 'r2']).default('google_drive'),
  // Google Drive — server-side only; leave empty until credentials are provisioned
  GOOGLE_DRIVE_CLIENT_ID: optionalSecret,
  GOOGLE_DRIVE_CLIENT_SECRET: optionalSecret,
  GOOGLE_DRIVE_REFRESH_TOKEN: optionalSecret,
  GOOGLE_DRIVE_ROOT_FOLDER_ID: optionalSecret,
  // Cloudflare R2 — server-side only; leave empty until credentials are provisioned
  R2_ACCOUNT_ID: optionalSecret,
  R2_ACCESS_KEY_ID: optionalSecret,
  R2_SECRET_ACCESS_KEY: optionalSecret,
  R2_BUCKET_NAME: optionalSecret,
  R2_ENDPOINT: optionalSecret,
  R2_PUBLIC_BASE_URL: optionalSecret,
  WEBSITE_COUPLE_NAME: z.string().trim().min(1).max(80).default('Rohit & Roshni'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

const env = parsed.data;

/**
 * Centralized application configuration.
 * Storage secrets are server-side only — never expose them to the frontend.
 */
export const config = Object.freeze({
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  host: env.HOST,
  corsOrigin: env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  logLevel: env.LOG_LEVEL,
  mongodbUri: env.MONGODB_URI,
  auth: Object.freeze({
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    bcryptRounds: env.BCRYPT_ROUNDS,
    cookieSecure: env.AUTH_COOKIE_SECURE ?? env.NODE_ENV === 'production',
    cookieSameSite: 'lax',
  }),
  storage: Object.freeze({
    defaultProvider: env.STORAGE_DEFAULT_PROVIDER,
    googleDrive: Object.freeze({
      clientId: env.GOOGLE_DRIVE_CLIENT_ID,
      clientSecret: env.GOOGLE_DRIVE_CLIENT_SECRET,
      refreshToken: env.GOOGLE_DRIVE_REFRESH_TOKEN,
      rootFolderId: env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    }),
    r2: Object.freeze({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
      endpoint: env.R2_ENDPOINT,
      publicBaseUrl: env.R2_PUBLIC_BASE_URL,
    }),
  }),
  website: Object.freeze({
    coupleName: env.WEBSITE_COUPLE_NAME,
  }),
});
