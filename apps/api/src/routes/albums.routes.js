import { Router } from 'express';
import { listAlbums, getAlbum } from '../controllers/albums.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { albumListQuerySchema, idParamSchema } from '../validators/common.validators.js';
import { PERMISSIONS } from '@wedding-memory/shared';

const albumsRouter = Router();

albumsRouter.use(requireAuth);

albumsRouter.get(
  '/',
  requirePermission(PERMISSIONS.ALBUM_VIEW),
  validate(albumListQuerySchema, 'query'),
  asyncHandler(listAlbums),
);

albumsRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.ALBUM_VIEW),
  validate(idParamSchema, 'params'),
  asyncHandler(getAlbum),
);

export { albumsRouter };
