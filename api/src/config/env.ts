function num(key: string, fallback: number): number {
  const raw = process.env[key]
  if (raw === undefined || raw === "") return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",

  ai: {
    openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
    defaultModel: process.env.LLM_MODEL ?? "opencode/deepseek-v4-flash-free",
    fallbackModel: process.env.LLM_FALLBACK_MODEL ?? "google/gemini-2.0-flash-exp:free",
    maxTokens: num("LLM_MAX_TOKENS", 2048),
    temperature: num("LLM_TEMPERATURE", 0.7),
  },

  guardrails: {
    maxInputChars: num("MAX_INPUT_CHARS", 4000),
    maxReplyChars: num("MAX_REPLY_CHARS", 1500),
    rateShortMax: num("RATE_LIMIT_SHORT_MAX", 8),
    rateShortWindowMs: num("RATE_LIMIT_SHORT_WINDOW_MS", 30_000),
    rateLongMax: num("RATE_LIMIT_LONG_MAX", 60),
    rateLongWindowMs: num("RATE_LIMIT_LONG_WINDOW_MS", 3_600_000),
    dailyLlmBudget: num("DAILY_LLM_BUDGET", 2000),
  },
} as const
