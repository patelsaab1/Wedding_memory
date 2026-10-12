import { Router } from 'express';
import { login, logout, me, refresh } from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rate-limit.js';
import { loginBodySchema } from '../validators/auth.validators.js';

const authRouter = Router();

authRouter.post('/login', loginRateLimiter, validate(loginBodySchema, 'body'), asyncHandler(login));

authRouter.post('/logout', optionalAuth, asyncHandler(logout));

authRouter.post('/refresh', asyncHandler(refresh));

authRouter.get('/me', requireAuth, asyncHandler(me));

export { authRouter };
