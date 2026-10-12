import { Router } from 'express';
import { listHomeSections, listWebsiteSections } from '../controllers/website.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { websiteSectionsQuerySchema } from '../validators/common.validators.js';
import { PERMISSIONS } from '@wedding-memory/shared';

const websiteRouter = Router();

websiteRouter.use(requireAuth);

websiteRouter.get('/home', asyncHandler(listHomeSections));

websiteRouter.get(
  '/sections',
  requirePermission(PERMISSIONS.WEBSITE_MANAGE),
  validate(websiteSectionsQuerySchema, 'query'),
  asyncHandler(listWebsiteSections),
);

export { websiteRouter };
