import pino from 'pino';
import { config } from './index.js';

export const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  redact: ['DATABASE_URL', 'JWT_SECRET', 'OPENROUTER_API_KEY', 'creds'],
});
