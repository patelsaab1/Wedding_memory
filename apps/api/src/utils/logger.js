const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Minimal structured logger. Avoid logging secrets, tokens, or PII.
 */
export function createLogger({ level = 'info', service = 'api' } = {}) {
  const threshold = LOG_LEVELS[level] ?? LOG_LEVELS.info;

  const write = (severity, message, meta = {}) => {
    if ((LOG_LEVELS[severity] ?? 99) > threshold) {
      return;
    }

    const entry = {
      level: severity,
      service,
      message,
      time: new Date().toISOString(),
      ...meta,
    };

    const line = JSON.stringify(entry);

    if (severity === 'error') {
      console.error(line);
      return;
    }

    if (severity === 'warn') {
      console.warn(line);
      return;
    }

    // eslint-disable-next-line no-console -- intentional structured logger output
    console.log(line);
  };

  return {
    error: (message, meta) => write('error', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    info: (message, meta) => write('info', message, meta),
    debug: (message, meta) => write('debug', message, meta),
  };
}
