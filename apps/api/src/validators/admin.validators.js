import { z } from 'zod';

const driveId = z.string().regex(/^[a-zA-Z0-9_-]{8,128}$/, 'Invalid id');

export const adminSectionParamsSchema = z.object({
  key: z.string().trim().min(1).max(100),
});

export const adminSectionBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  eyebrow: z.string().trim().max(80).optional().default(''),
  description: z.string().trim().max(400).optional().default(''),
  enabled: z.boolean(),
});

export const adminReorderBodySchema = z.object({
  keys: z.array(z.string().trim().min(1).max(100)).min(1).max(24),
});

export const adminAlbumBodySchema = z.object({
  title: z.string().trim().min(2).max(80),
});

export const adminFolderParamsSchema = z.object({
  folderId: driveId,
});

export const adminGuestBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  role: z.enum(['family', 'viewer']),
  activeDays: z.coerce.number().int().min(1).max(90),
});

export const adminGuestParamsSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

export const adminAlbumAccessBodySchema = z.object({
  secret: z.boolean(),
  memberIds: z.array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id')).max(100),
});
