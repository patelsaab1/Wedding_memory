import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { registerRoutes } from './routes/index.js';
import { registerWebApp } from './serve-web.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { csrfProtection } from './middleware/auth.js';

/**
 * Build and configure the Express application.
 */
export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(requestLogger());
  app.use(csrfProtection);

  registerRoutes(app);
  registerWebApp(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
