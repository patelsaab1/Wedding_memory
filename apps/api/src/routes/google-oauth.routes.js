import { Router } from 'express';
import { googleDriveCallback } from '../controllers/google-oauth.controller.js';

const googleOauthRouter = Router();

googleOauthRouter.get('/', googleDriveCallback);
googleOauthRouter.get('/callback', googleDriveCallback);

export { googleOauthRouter };
