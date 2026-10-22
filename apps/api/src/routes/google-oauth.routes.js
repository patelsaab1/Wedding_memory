import { Router } from 'express';
import { optionalAuth, requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  googleDriveCallback,
  googleDriveConnect,
  googleDriveRefresh,
  googleDriveStatus,
} from '../controllers/google-oauth.controller.js';

const googleOauthRouter = Router();

googleOauthRouter.get('/status', requireAuth, requireSuperAdmin, asyncHandler(googleDriveStatus));
googleOauthRouter.post('/refresh', requireAuth, requireSuperAdmin, asyncHandler(googleDriveRefresh));
googleOauthRouter.get('/connect', requireAuth, requireSuperAdmin, asyncHandler(googleDriveConnect));
googleOauthRouter.get('/callback', optionalAuth, asyncHandler(googleDriveCallback));

export { googleOauthRouter };
