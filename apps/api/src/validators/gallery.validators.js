import { z } from 'zod';

const driveId = z.string().regex(/^[a-zA-Z0-9_-]{8,128}$/, 'Invalid id');

export const galleryFileParamsSchema = z.object({
  fileId: driveId,
});

export const galleryAlbumParamsSchema = z.object({
  folderId: driveId,
});

export const galleryAlbumQuerySchema = z.object({
  pageToken: z.string().min(1).max(1024).optional(),
  pageSize: z.coerce.number().int().min(1).max(60).default(40),
});
