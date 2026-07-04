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
    llmApiKey: process.env.LLM_API_KEY ?? process.env.OPENROUTER_API_KEY ?? "",
    openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
    llmBaseUrl: process.env.LLM_BASE_URL ?? "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: process.env.LLM_MODEL ?? "deepseek-v4-flash-free",
    fallbackModel: process.env.LLM_FALLBACK_MODEL ?? "north-mini-code-free",
    maxTokens: num("LLM_MAX_TOKENS", 2048),
    temperature: num("LLM_TEMPERATURE", 0.7)
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET ?? "",
    jwtExpires: process.env.JWT_EXPIRES ?? "7d"
  },

  rag: {
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    embeddingModel: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
    embeddingDim: num("EMBEDDING_DIM", 1536),
    embeddingBatchSize: num("EMBEDDING_BATCH_SIZE", 100),
    chunkSize: num("KNOWLEDGE_CHUNK_SIZE", 500),
    chunkOverlap: num("KNOWLEDGE_CHUNK_OVERLAP", 100),
    topK: num("KNOWLEDGE_TOP_K", 3),
    similarityThreshold: num("KNOWLEDGE_SIMILARITY_THRESHOLD", 0.7),
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
    classifierModel: process.env.CLASSIFIER_MODEL ?? "north-mini-code-free",
    // Judge tier (deep analysis for SUSPICIOUS cases)
    judgeEnabled: bool("JUDGE_ENABLED", true),
    judgeModel: process.env.JUDGE_MODEL ?? "north-mini-code-free",
    // Grounding check on output
    groundingEnabled: bool("GROUNDING_CHECK_ENABLED", true),
    groundingModel: process.env.GROUNDING_MODEL ?? "north-mini-code-free"
  }
} as const;
