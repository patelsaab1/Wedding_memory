import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { config } from './config/index.js';

const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');

/**
 * In production, serve the Vite build from this same host so login cookies stay first-party.
 * Missing API routes still return JSON. Client routes fall back to index.html.
 */
export function registerWebApp(app) {
  if (!config.isProduction) return;

  const indexFile = path.join(webDist, 'index.html');
  if (!fs.existsSync(indexFile)) return;

  app.use(
    express.static(webDist, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
          return;
        }
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );

  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    if (path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });
}
