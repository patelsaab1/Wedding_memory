import { createSuccessResponse } from '@wedding-memory/shared';
import { config } from '../config/index.js';
import { getDatabaseStatus, isDatabaseConnected } from '../config/database.js';

/**
 * Health check — API process + database readiness.
 */
export function getHealth(_req, res) {
  const databaseStatus = getDatabaseStatus();
  const healthy = isDatabaseConnected();

  res.status(healthy ? 200 : 503).json(
    createSuccessResponse({
      status: healthy ? 'ok' : 'degraded',
      service: 'wedding-memory-api',
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: databaseStatus,
        connected: healthy,
      },
    }),
  );
}
