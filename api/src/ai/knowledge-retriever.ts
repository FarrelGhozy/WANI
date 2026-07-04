import { prisma } from "@/src/config/db"
import { env } from "@/src/config/env"
import { logger } from "@/src/config/logger"
import { createEmbedding } from "@/src/ai/embedding"
import type { RetrievalResult } from "@/src/types/knowledge"

/**
 * Retrieve top-K knowledge chunks relevant to the query via cosine similarity.
 * Uses pgvector `<=>` operator (cosine distance) with HNSW index.
 * Returns chunks with similarity score above the configured threshold.
 */
export async function retrieveRelevantKnowledge(
  query: string,
  options?: { topK?: number; threshold?: number },
): Promise<RetrievalResult[]> {
  const topK = options?.topK ?? env.rag.topK
  const threshold = options?.threshold ?? env.rag.similarityThreshold

  if (!env.rag.openaiApiKey) {
    logger.warn("knowledge retrieval: OPENAI_API_KEY not configured, skipping")
    return []
  }

  if (!query.trim()) return []

  // 1. Embed the query
  let embeddingResult
  try {
    embeddingResult = await createEmbedding(query)
  } catch (err) {
    logger.error("knowledge retrieval: query embedding failed", {
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }

  const embeddingStr = `[${embeddingResult.embedding.join(",")}]`

  // 2. Cosine similarity search via pgvector
  // Score = 1 - cosine_distance (1 = identical, 0 = orthogonal)
  const results = await prisma.$queryRaw<RetrievalResult[]>`
    SELECT
      kc.content,
      1 - (kc.embedding <=> ${embeddingStr}::vector) AS score,
      kc."documentId",
      kd.title AS "documentTitle"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
    WHERE kd."isActive" = true
      AND 1 - (kc.embedding <=> ${embeddingStr}::vector) > ${threshold}
    ORDER BY kc.embedding <=> ${embeddingStr}::vector
    LIMIT ${topK}
  `

  return results
}