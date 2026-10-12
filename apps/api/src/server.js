import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger({ level: config.logLevel, service: 'api' });

async function start() {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(config.port, config.host, () => {
    logger.info('API server started', {
      host: config.host,
      port: config.port,
      env: config.env,
      health: `http://localhost:${config.port}/api/v1/health`,
    });
  });

  function shutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      try {
        await disconnectDatabase();
      } catch (error) {
        logger.error('Error during database disconnect', {
          message: error instanceof Error ? error.message : String(error),
        });
      }
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      message: error.message,
      stack: config.isProduction ? undefined : error.stack,
    });
    process.exit(1);
  });
}

start().catch((error) => {
  logger.error('Failed to start API server', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
