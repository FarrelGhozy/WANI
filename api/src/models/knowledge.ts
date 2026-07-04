import { BaseModel } from "@/src/models/base"
import { prisma } from "@/src/config/db"
import type { KnowledgeDocument } from "@db/client"
import type { ChunkInsert, KnowledgeDocumentInput } from "@/src/types/knowledge"

/**
 * Insert chunks with pgvector embeddings via raw SQL.
 * Prisma can't type `vector(1536)` natively, so we bypass it here.
 */
async function insertChunks(documentId: string, chunks: ChunkInsert[]): Promise<void> {
  if (chunks.length === 0) return

  const values: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  for (const chunk of chunks) {
    const id = crypto.randomUUID()
    values.push(
      `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}::vector, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6})`,
    )
    params.push(
      id,
      documentId,
      chunk.content,
      `[${chunk.embedding.join(",")}]`,
      chunk.chunkIndex,
      chunk.tokenCount,
    )
    paramIdx += 7
  }

  const sql = `
    INSERT INTO "KnowledgeChunk" ("id", "documentId", "content", "embedding", "chunkIndex", "tokenCount", "createdAt")
    VALUES ${values.join(", ")}
  `

  await prisma.$executeRawUnsafe(sql, ...params)
}

export class KnowledgeModel extends BaseModel {
  protected static override get delegate() {
    return prisma.knowledgeDocument
  }

  static async list(): Promise<KnowledgeDocument[]> {
    return this.delegate.findMany({
      orderBy: { createdAt: "desc" },
    })
  }

  static async findById(id: string): Promise<KnowledgeDocument | null> {
    return this.delegate.findUnique({ where: { id } })
  }

  static async createDocument(data: KnowledgeDocumentInput): Promise<KnowledgeDocument> {
    return this.delegate.create({
      data: {
        id: crypto.randomUUID(),
        title: data.title,
        content: data.content,
        source: data.source === undefined ? null : data.source,
      },
    })
  }

  static async updateDocument(
    id: string,
    data: Partial<KnowledgeDocumentInput>,
  ): Promise<KnowledgeDocument | null> {
    try {
      return await this.delegate.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.source !== undefined && { source: data.source }),
        },
      })
    } catch {
      return null
    }
  }

  static async deleteDocument(id: string): Promise<boolean> {
    try {
      await this.delegate.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  }

  static async setChunkCount(documentId: string, count: number): Promise<void> {
    await this.delegate.update({
      where: { id: documentId },
      data: { chunkCount: count },
    })
  }

  static async deleteChunks(documentId: string): Promise<void> {
    await prisma.knowledgeChunk.deleteMany({ where: { documentId } })
  }

  static async insertChunks(documentId: string, chunks: ChunkInsert[]): Promise<void> {
    await insertChunks(documentId, chunks)
  }

  static async getChunkCount(documentId: string): Promise<number> {
    return prisma.knowledgeChunk.count({ where: { documentId } })
  }
}