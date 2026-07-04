import { env } from "@/src/config/env"
import { logger } from "@/src/config/logger"
import type { TokenUsage } from "@/src/types/ai"
import type { EmbeddingResult } from "@/src/types/knowledge"

const OPENAI_BASE = "https://api.openai.com/v1/embeddings"

export class EmbeddingError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message)
    this.name = "EmbeddingError"
  }
}

/**
 * Create embeddings for a batch of texts via OpenAI direct.
 * OpenRouter doesn't support /embeddings, so we talk to OpenAI directly.
 */
export async function createEmbeddings(
  texts: string[],
  options?: { timeout?: number },
): Promise<EmbeddingResult[]> {
  if (!env.rag.openaiApiKey) {
    throw new EmbeddingError("OPENAI_API_KEY is not configured", false)
  }
  if (texts.length === 0) return []

  const timeout = options?.timeout ?? 30_000
  const batchSize = env.rag.embeddingBatchSize
  const results: EmbeddingResult[] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const res = await fetch(OPENAI_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.rag.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.rag.embeddingModel,
        input: batch,
      }),
      signal: AbortSignal.timeout(timeout),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      logger.error("embedding API error", { status: res.status, body })
      const retryable = res.status === 429 || res.status >= 500
      throw new EmbeddingError(
        `OpenAI embeddings failed (${res.status}): ${body.slice(0, 200)}`,
        retryable,
      )
    }

    const json = (await res.json()) as {
      data: Array<{ embedding: number[]; index: number }>
      usage: { prompt_tokens: number; total_tokens: number }
    }

    for (const d of json.data) {
      results[d.index] = { embedding: d.embedding, tokens: 0 }
    }
    const batchTokens = json.usage?.prompt_tokens ?? 0
    for (let j = 0; j < batch.length; j++) {
      results[i + j]!.tokens = Math.ceil(batchTokens / batch.length)
    }
  }

  return results
}

export async function createEmbedding(text: string): Promise<EmbeddingResult> {
  return (await createEmbeddings([text]))[0]!
}

export function embeddingTokenUsage(tokens: number): TokenUsage {
  return { promptTokens: tokens, completionTokens: 0 }
}