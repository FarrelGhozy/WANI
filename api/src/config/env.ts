function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",

  ai: {
    openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
    defaultModel: process.env.LLM_MODEL ?? "google/gemma-4-31b-it:free",
    fallbackModel: process.env.LLM_FALLBACK_MODEL ?? "qwen/qwen3-next-80b-a3b-instruct:free",
    maxTokens: num("LLM_MAX_TOKENS", 2048),
    temperature: num("LLM_TEMPERATURE", 0.7)
  },

  guardrails: {
    maxInputChars: num("MAX_INPUT_CHARS", 4000),
    maxReplyChars: num("MAX_REPLY_CHARS", 1500),
    rateShortMax: num("RATE_LIMIT_SHORT_MAX", 8),
    rateShortWindowMs: num("RATE_LIMIT_SHORT_WINDOW_MS", 30_000),
    rateLongMax: num("RATE_LIMIT_LONG_MAX", 60),
    rateLongWindowMs: num("RATE_LIMIT_LONG_WINDOW_MS", 3_600_000),
    dailyLlmBudget: num("DAILY_LLM_BUDGET", 2000),

    // Classifier tier (ML model via OpenRouter)
    classifierEnabled: bool("CLASSIFIER_ENABLED", true),
    classifierModel: process.env.CLASSIFIER_MODEL ?? "qwen/qwen3-next-80b-a3b-instruct:free",
    // Judge tier (deep analysis for SUSPICIOUS cases)
    judgeEnabled: bool("JUDGE_ENABLED", true),
    judgeModel: process.env.JUDGE_MODEL ?? "qwen/qwen3-next-80b-a3b-instruct:free",
    // Grounding check on output
    groundingEnabled: bool("GROUNDING_CHECK_ENABLED", true),
    groundingModel: process.env.GROUNDING_MODEL ?? "qwen/qwen3-next-80b-a3b-instruct:free"
  }
} as const;
