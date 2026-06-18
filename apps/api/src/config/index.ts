import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env: ${key}`);
  return val;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    url: requireEnv('DATABASE_URL'),
  },

  whatsapp: {
    phone: process.env.WA_PHONE || '',
  },

  ai: {
    openrouterApiKey: requireEnv('OPENROUTER_API_KEY'),
    defaultModel: process.env.LLM_MODEL || 'opencode/deepseek-v4-flash-free',
    fallbackModel: 'google/gemini-2.0-flash-exp:free',
    maxTokens: 2048,
    temperature: 0.7,
  },

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  auth: {
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiresIn: '7d',
  },
} as const;

export type Config = typeof config;
