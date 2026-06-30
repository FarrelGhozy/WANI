# RAG Knowledge Base — Tahap 3

> Upgrade AI dari plain text knowledge base ke vector-based Retrieval Augmented Generation

---

## Current State

- `AiConfig.knowledgeBase` adalah plain text field
- System prompt meng-inject knowledge base mentah tanpa retrieval
- Tidak ada semantic search
- Context window boros (semua knowledge di-inject setiap request)

## Target State

1. Knowledge base disimpan sebagai vector embeddings
2. Query untuk mencari knowledge yang relevan dengan pertanyaan customer
3. Hanya knowledge yang relevan di-inject ke system prompt
4. Context window efisien, jawaban lebih akurat

---

## 1. Database Schema

### Migration Baru

```prisma
// api/prisma/models/knowledge.prisma
model KnowledgeDocument {
  id        String   @id @default(uuid())
  storeId   String   @default("default")
  title     String
  content   String
  source    String?  // URL / file / manual
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  indexes   String[] // Array index names

  chunks    KnowledgeChunk[]
  @@index([storeId])
}

model KnowledgeChunk {
  id         String   @id @default(uuid())
  documentId String
  document   KnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  content    String
  embedding  Unsupported("vector(1536)")?  // Untuk pgvector
  chunkIndex Int
  metadata   Json?
  createdAt  DateTime @default(now())
  @@index([documentId])
}
```

### pgvector Extension

```sql
-- migration.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON "KnowledgeChunk"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## 2. Embedding Service

```typescript
// api/src/services/embedding.ts
interface EmbeddingResult {
  embedding: number[]
  tokens: number
}

export async function createEmbedding(text: string): Promise<EmbeddingResult> {
  const response = await fetch(`${LLM_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',  // Murah + bagus
      input: text,
    }),
  })

  const json = await response.json()
  return {
    embedding: json.data[0].embedding,
    tokens: json.usage.total_tokens,
  }
}
```

---

## 3. Indexing Pipeline

```typescript
// api/src/services/knowledge-indexer.ts

/**
 * 1. Split document into chunks (500 chars, 100 overlap)
 * 2. Create embedding for each chunk
 * 3. Store chunks with embeddings
 */
export async function indexDocument(doc: KnowledgeDocument): Promise<void> {
  const chunks = splitIntoChunks(doc.content, {
    chunkSize: 500,
    overlap: 100,
  })

  for (const [i, chunk] of chunks.entries()) {
    const { embedding } = await createEmbedding(chunk)

    await prisma.knowledgeChunk.create({
      data: {
        documentId: doc.id,
        content: chunk,
        embedding: embedding as any, // pgvector type
        chunkIndex: i,
      },
    })
  }
}

function splitIntoChunks(text: string, opts: { chunkSize: number; overlap: number }): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)

  let current = ''
  for (const sentence of sentences) {
    if (current.length + sentence.length > opts.chunkSize && current.length > 0) {
      chunks.push(current.trim())
      current = current.slice(-opts.overlap) + ' ' + sentence
    } else {
      current += (current ? ' ' : '') + sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())

  return chunks
}
```

---

## 4. Retrieval Query

```typescript
// api/src/services/knowledge-retriever.ts

interface RetrievalResult {
  content: string
  score: number       // Cosine similarity
  documentTitle: string
}

export async function retrieveRelevantKnowledge(
  query: string,
  topK: number = 3,
  threshold: number = 0.7
): Promise<RetrievalResult[]> {
  // 1. Create embedding untuk query
  const { embedding } = await createEmbedding(query)

  // 2. Cari chunks terdekat via cosine similarity
  const results = await prisma.$queryRaw<RetrievalResult[]>`
    SELECT
      kc.content,
      1 - (kc.embedding <=> ${embedding}::vector) AS score,
      kd.title AS "documentTitle"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
    WHERE kd."storeId" = 'default'
      AND 1 - (kc.embedding <=> ${embedding}::vector) > ${threshold}
    ORDER BY kc.embedding <=> ${embedding}::vector
    LIMIT ${topK}
  `

  return results
}
```

---

## 5. Integrasi ke AI Pipeline

### Step Baru: `retrieveKnowledge`

```typescript
// api/src/ai/pipeline/steps/retrieveKnowledge.ts
// Disisipkan setelah contextLoader, sebelum messageBuilder

export async function retrieveKnowledgeStep(ctx: PipelineContext): Promise<StepOutcome> {
  if (!ctx.normalized) {
    return { kind: 'continue' }
  }

  const relevant = await retrieveRelevantKnowledge(ctx.normalized, 3)

  ctx.knowledgeContext = relevant
    .map(r => `**${r.documentTitle}**\n${r.content}`)
    .join('\n\n---\n\n')

  return { kind: 'continue' }
}
```

### Update prompt builder

```typescript
// api/src/ai/prompts.ts — tambahkan knowledge context
export function buildSystemPrompt(params: PromptParams): string {
  let prompt = basePrompt

  // ... store info, products, etc.

  // Knowledge base (hanya yang relevan)
  if (params.knowledgeContext) {
    prompt += `\n\n## Informasi Relevan\n${params.knowledgeContext}`
  }

  return prompt
}
```

---

## 6. Dashboard: Knowledge Management UI

### Tambah tab di Settings

```
Settings
  ├── Toko
  ├── AI Agent
  ├── Knowledge Base  ← NEW
  ├── WA Session
  └── Pembayaran
```

### Fitur

1. CRUD dokumen knowledge
2. Upload dokumen (PDF, TXT, markdown)
3. Index/Reindex button
4. Test query (cari knowledge yang relevan)
5. Tampilkan chunk count, index status

---

## 7. Alternative: Lightweight RAG tanpa pgvector

Jika pgvector tidak available (shared hosting), fallback ke:

### TF-IDF based retrieval

```typescript
// api/src/services/knowledge-retriever-tfidf.ts
// Simpan chunks sebagai plain text
// Gunakan simple TF-IDF scoring untuk retrieval
// Tidak perlu pgvector, tapi kurang akurat

function tfidfScore(query: string, document: string): number {
  const queryTerms = tokenize(query)
  const docTerms = tokenize(document)

  let score = 0
  for (const term of queryTerms) {
    const tf = docTerms.filter(t => t === term).length / docTerms.length
    const idf = Math.log(totalDocs / docsWithTerm(term))
    score += tf * idf
  }
  return score
}
```

---

## Checklist RAG

- [ ] pgvector extension terinstall di PostgreSQL
- [ ] Schema KnowledgeDocument + KnowledgeChunk
- [ ] Embedding service (OpenAI compatible)
- [ ] Indexing pipeline (chunk + embed + store)
- [ ] Retrieval query (cosine similarity search)
- [ ] Integrasi ke AI pipeline (retrieveKnowledge step)
- [ ] Dashboard UI untuk knowledge management
- [ ] Unit tests untuk chunker, retriever
- [ ] Integration test untuk full RAG flow
- [ ] Benchmark: akurasi jawaban dengan vs tanpa RAG
