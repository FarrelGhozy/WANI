import type { Request, Response } from "express"
import type { z } from "zod"
import { KnowledgeModel } from "@/src/models/knowledge"
import { indexDocument, reindexAll } from "@/src/ai/knowledge-indexer"
import { retrieveRelevantKnowledge } from "@/src/ai/knowledge-retriever"
import { sendResponse } from "@/src/utils/response"
import { NotFoundError, BadRequestError } from "@/src/utils/errors"
import { createKnowledgeSchema, updateKnowledgeSchema, knowledgeQuerySchema } from "@/src/schemas/knowledge"

type CreateBody = z.infer<typeof createKnowledgeSchema>
type UpdateBody = z.infer<typeof updateKnowledgeSchema>
type QueryBody = z.infer<typeof knowledgeQuerySchema>

export async function listDocuments(_req: Request, res: Response): Promise<void> {
  const docs = await KnowledgeModel.list()
  sendResponse(res, 200, "knowledge documents retrieved", { items: docs })
}

export async function getDocument(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const doc = await KnowledgeModel.findById(req.params.id)
  if (!doc) throw new NotFoundError("document not found")
  const chunkCount = await KnowledgeModel.getChunkCount(req.params.id)
  sendResponse(res, 200, "document retrieved", { ...doc, indexedChunks: chunkCount })
}

export async function createDocument(
  req: Request<Record<string, string>, any, CreateBody>,
  res: Response,
): Promise<void> {
  const doc = await KnowledgeModel.createDocument(req.body)

  // Auto-index on create (sync — small docs are fast)
  let indexResult = null
  try {
    indexResult = await indexDocument(doc)
  } catch {
    // Indexing failed but document is saved; user can reindex later
  }

  sendResponse(res, 201, "document created", { ...doc, indexResult })
}

export async function updateDocument(
  req: Request<{ id: string }, any, UpdateBody>,
  res: Response,
): Promise<void> {
  const existing = await KnowledgeModel.findById(req.params.id)
  if (!existing) throw new NotFoundError("document not found")

  const doc = await KnowledgeModel.updateDocument(req.params.id, req.body)
  if (!doc) throw new NotFoundError("document not found")

  // Re-index if content changed
  if (req.body.content !== undefined) {
    try {
      await indexDocument(doc)
    } catch {
      // Indexing failed; document is still updated
    }
  }

  sendResponse(res, 200, "document updated", doc)
}

export async function deleteDocument(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const existing = await KnowledgeModel.findById(req.params.id)
  if (!existing) throw new NotFoundError("document not found")

  await KnowledgeModel.deleteDocument(req.params.id)
  sendResponse(res, 200, "document deleted")
}

export async function reindexDocument(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const doc = await KnowledgeModel.findById(req.params.id)
  if (!doc) throw new NotFoundError("document not found")

  const result = await indexDocument(doc)
  sendResponse(res, 200, "document reindexed", result)
}

export async function reindexAllDocuments(_req: Request, res: Response): Promise<void> {
  const results = await reindexAll()
  sendResponse(res, 200, "all documents reindexed", { items: results })
}

export async function testQuery(
  req: Request<Record<string, string>, any, QueryBody>,
  res: Response,
): Promise<void> {
  const { query, topK } = req.body
  const results = await retrieveRelevantKnowledge(query, { topK: Number(topK) })
  sendResponse(res, 200, "query results", { items: results })
}