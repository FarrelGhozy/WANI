import { KnowledgeModel } from "@/src/models/knowledge"
import { splitIntoChunks } from "@/src/ai/chunker"
import { createEmbeddings, embeddingTokenUsage, EmbeddingError } from "@/src/ai/embedding"
import { recordLlmUsage } from "@/src/guardrails/budget"
import { logger } from "@/src/config/logger"
import type { KnowledgeDocument } from "@db/client"
import type { IndexResult } from "@/src/types/knowledge"

/**
 * Index a document: chunk → embed → store with pgvector.
 * Replaces any existing chunks for the document.
 */
export async function indexDocument(doc: KnowledgeDocument): Promise<IndexResult> {
  const { id, content } = doc

  // 1. Delete existing chunks
  await KnowledgeModel.deleteChunks(id)

  // 2. Split into chunks
  const chunks = splitIntoChunks(content)
  if (chunks.length === 0) {
    await KnowledgeModel.setChunkCount(id, 0)
    logger.info("knowledge index: empty document", { documentId: id })
    return { documentId: id, chunkCount: 0, tokensUsed: 0 }
  }

  // 3. Batch embed all chunks
  let embeddings
  try {
    embeddings = await createEmbeddings(chunks)
  } catch (err) {
    if (err instanceof EmbeddingError) {
      logger.error("knowledge index: embedding failed", {
        documentId: id,
        error: err.message,
        retryable: err.retryable,
      })
    }
    throw err
  }

  // 4. Insert chunks with embeddings
  const chunkInserts = embeddings.map((e, i) => ({
    content: chunks[i]!,
    embedding: e.embedding,
    chunkIndex: i,
    tokenCount: e.tokens,
  }))

  await KnowledgeModel.insertChunks(id, chunkInserts)

  // 5. Update document metadata
  const totalTokens = embeddings.reduce((sum, e) => sum + e.tokens, 0)
  await KnowledgeModel.setChunkCount(id, chunks.length)

  // 6. Track embedding cost in daily LLM budget
  await recordLlmUsage(embeddingTokenUsage(totalTokens))

  logger.info("knowledge index: success", {
    documentId: id,
    chunkCount: chunks.length,
    tokens: totalTokens,
  })

  return {
    documentId: id,
    chunkCount: chunks.length,
    tokensUsed: totalTokens,
  }
}

/**
 * Reindex all active documents. Used when embedding model changes.
 */
export async function reindexAll(): Promise<IndexResult[]> {
  const docs = await KnowledgeModel.list()
  const results: IndexResult[] = []

  for (const doc of docs) {
    if (!doc.isActive) continue
    try {
      const result = await indexDocument(doc)
      results.push(result)
    } catch (err) {
      logger.error("knowledge reindex: failed", {
        documentId: doc.id,
        title: doc.title,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return results
}