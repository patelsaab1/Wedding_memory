import morgan from 'morgan';
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger({ level: config.logLevel, service: 'http' });

morgan.token('request-id', (req) => req.requestId || '-');

/**
 * HTTP access logging via morgan, piped into the structured logger.
 * Does not log request bodies (avoid accidentally logging secrets).
 */
export function requestLogger() {
  const format = config.isProduction
    ? ':remote-addr :method :url :status :res[content-length] - :response-time ms rid=:request-id'
    : ':method :url :status :response-time ms rid=:request-id';

  return morgan(format, {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
    skip: () => config.isTest,
  });
}
