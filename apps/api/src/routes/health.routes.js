import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (req, res) => getHealth(req, res)),
);

export { healthRouter };
