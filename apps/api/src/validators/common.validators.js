import { z } from 'zod';
import {
  ALBUM_CATEGORIES,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  MEDIA_TYPES,
  STORAGE_PROVIDERS,
  VISIBILITY,
} from '@wedding-memory/shared';

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id format');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const booleanQuerySchema = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  });

export const albumListQuerySchema = paginationQuerySchema.extend({
  isPublished: booleanQuerySchema,
  category: z.enum(Object.values(ALBUM_CATEGORIES)).optional(),
});

export const albumCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
  description: z.string().trim().max(2000).optional().default(''),
  coverMediaId: objectIdSchema.nullable().optional(),
  category: z.enum(Object.values(ALBUM_CATEGORIES)).optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  createdBy: objectIdSchema.nullable().optional(),
});

export const mediaListQuerySchema = paginationQuerySchema.extend({
  albumId: objectIdSchema.optional(),
  mediaType: z.enum(Object.values(MEDIA_TYPES)).optional(),
  provider: z.enum(Object.values(STORAGE_PROVIDERS)).optional(),
  visibility: z.enum(Object.values(VISIBILITY)).optional(),
});

export const mediaCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  provider: z.enum(Object.values(STORAGE_PROVIDERS)),
  providerFileId: z.string().trim().min(1).optional().nullable(),
  storageKey: z.string().trim().min(1).optional().nullable(),
  albumId: objectIdSchema.optional().nullable(),
  mediaType: z.enum(Object.values(MEDIA_TYPES)),
  mimeType: z.string().trim().min(1).max(150),
  fileName: z.string().trim().min(1).max(500),
  fileSize: z.number().int().min(0),
  thumbnail: z
    .object({
      url: z.string().url().optional(),
      providerFileId: z.string().optional(),
      storageKey: z.string().optional(),
      width: z.number().int().min(0).optional(),
      height: z.number().int().min(0).optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
  visibility: z.enum(Object.values(VISIBILITY)).optional(),
  isActive: z.boolean().optional(),
});

export const documentListQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().max(100).optional(),
  visibility: z.enum(Object.values(VISIBILITY)).optional(),
});

export const websiteSectionsQuerySchema = z.object({
  enabledOnly: booleanQuerySchema,
});
