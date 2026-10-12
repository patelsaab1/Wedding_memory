import { Router } from 'express';
import { listDocuments } from '../controllers/documents.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { documentListQuerySchema } from '../validators/common.validators.js';
import { PERMISSIONS } from '@wedding-memory/shared';

const documentsRouter = Router();

documentsRouter.use(requireAuth);

documentsRouter.get(
  '/',
  requirePermission(PERMISSIONS.DOCUMENTS_VIEW),
  validate(documentListQuerySchema, 'query'),
  asyncHandler(listDocuments),
);

export { documentsRouter };
