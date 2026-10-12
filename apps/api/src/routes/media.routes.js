import { Router } from 'express';
import { listMedia, getMedia } from '../controllers/media.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { idParamSchema, mediaListQuerySchema } from '../validators/common.validators.js';
import { PERMISSIONS } from '@wedding-memory/shared';

const mediaRouter = Router();

mediaRouter.use(requireAuth);

mediaRouter.get(
  '/',
  requirePermission(PERMISSIONS.MEDIA_VIEW),
  validate(mediaListQuerySchema, 'query'),
  asyncHandler(listMedia),
);

mediaRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.MEDIA_VIEW),
  validate(idParamSchema, 'params'),
  asyncHandler(getMedia),
);

export { mediaRouter };
