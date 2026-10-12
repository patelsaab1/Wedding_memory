import { Router } from 'express';
import { API_PREFIX } from '@wedding-memory/shared';
import { healthRouter } from './health.routes.js';
import { albumsRouter } from './albums.routes.js';
import { mediaRouter } from './media.routes.js';
import { documentsRouter } from './documents.routes.js';
import { websiteRouter } from './website.routes.js';
import { authRouter } from './auth.routes.js';
import { galleryRouter } from './gallery.routes.js';
import { googleOauthRouter } from './google-oauth.routes.js';
import { adminRouter } from './admin.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/albums', albumsRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/website', websiteRouter);
apiRouter.use('/gallery', galleryRouter);
apiRouter.use('/storage/google', googleOauthRouter);
apiRouter.use('/admin', adminRouter);

/**
 * Mount all versioned API routes under the shared prefix (/api/v1).
 */
export function registerRoutes(app) {
  app.use(API_PREFIX, apiRouter);
}
