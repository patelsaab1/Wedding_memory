import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { badRequestError } from '../utils/errors.js';
import {
  createAdminAlbum,
  createGuestLogin,
  endGuestLogin,
  listAdminFolders,
  listAlbumAccess,
  updateAlbumAccess,
  listAdminSections,
  listGuestLogins,
  reorderAdminSections,
  updateAdminSection,
  uploadAdminFile,
} from '../controllers/admin.controller.js';
import {
  adminAlbumAccessBodySchema,
  adminAlbumBodySchema,
  adminFolderParamsSchema,
  adminGuestBodySchema,
  adminGuestParamsSchema,
  adminReorderBodySchema,
  adminSectionBodySchema,
  adminSectionParamsSchema,
} from '../validators/admin.validators.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024, files: 1 },
});

function receiveFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Each file must be 40 MB or smaller'
      : 'That file could not be read';
    next(badRequestError(message));
  });
}

const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireSuperAdmin);

adminRouter.get('/sections', asyncHandler(listAdminSections));
adminRouter.put(
  '/sections/order',
  validate(adminReorderBodySchema, 'body'),
  asyncHandler(reorderAdminSections),
);
adminRouter.patch(
  '/sections/:key',
  validate(adminSectionParamsSchema, 'params'),
  validate(adminSectionBodySchema, 'body'),
  asyncHandler(updateAdminSection),
);
adminRouter.get('/guests', asyncHandler(listGuestLogins));
adminRouter.post('/guests', validate(adminGuestBodySchema, 'body'), asyncHandler(createGuestLogin));
adminRouter.patch(
  '/guests/:userId',
  validate(adminGuestParamsSchema, 'params'),
  asyncHandler(endGuestLogin),
);
adminRouter.get('/folders', asyncHandler(listAdminFolders));
adminRouter.get('/album-access', asyncHandler(listAlbumAccess));
adminRouter.put(
  '/folders/:folderId/access',
  validate(adminFolderParamsSchema, 'params'),
  validate(adminAlbumAccessBodySchema, 'body'),
  asyncHandler(updateAlbumAccess),
);
adminRouter.post('/albums', validate(adminAlbumBodySchema, 'body'), asyncHandler(createAdminAlbum));
adminRouter.post(
  '/folders/:folderId/files',
  validate(adminFolderParamsSchema, 'params'),
  receiveFile,
  asyncHandler(uploadAdminFile),
);

export { adminRouter };
