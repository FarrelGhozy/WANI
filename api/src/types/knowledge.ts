// ─────────────────────────────────────────────────────────────
//  RAG / Knowledge base types — consolidated
// ─────────────────────────────────────────────────────────────

// ---- Domain input ----

export interface KnowledgeDocumentInput {
  title: string
  content: string
  source?: string | null
}

// ---- Indexer & chunking ----

export interface ChunkInsert {
  content: string
  embedding: number[]
  chunkIndex: number
  tokenCount: number
}

export interface IndexResult {
  documentId: string
  chunkCount: number
  tokensUsed: number
}

// ---- Embedding service ----

export interface EmbeddingResult {
  embedding: number[]
  tokens: number
}

// ---- Retrieval ----

export interface RetrievalResult {
  content: string
  score: number
  documentId: string
  documentTitle: string
}