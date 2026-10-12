import { Router } from 'express';
import { PERMISSIONS } from '@wedding-memory/shared';
import { getAlbum, getGallery, streamPhoto } from '../controllers/gallery.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import {
  galleryAlbumParamsSchema,
  galleryAlbumQuerySchema,
  galleryFileParamsSchema,
} from '../validators/gallery.validators.js';

const galleryRouter = Router();

galleryRouter.use(requireAuth);
galleryRouter.use(requirePermission(PERMISSIONS.MEDIA_VIEW));

galleryRouter.get('/', asyncHandler(getGallery));

galleryRouter.get(
  '/albums/:folderId',
  validate(galleryAlbumParamsSchema, 'params'),
  validate(galleryAlbumQuerySchema, 'query'),
  asyncHandler(getAlbum),
);

galleryRouter.get(
  '/files/:fileId/content',
  validate(galleryFileParamsSchema, 'params'),
  streamPhoto,
);

export { galleryRouter };
