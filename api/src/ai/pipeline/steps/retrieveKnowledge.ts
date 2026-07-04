import { retrieveRelevantKnowledge } from "@/src/ai/knowledge-retriever"
import type { RetrievalResult } from "@/src/types/knowledge"
import type { PipelineStep } from "../types"

/**
 * Step 9.5 — Retrieve relevant knowledge chunks via RAG (pgvector cosine search).
 * Runs after context loading, before message building.
 * If no OPENAI_API_KEY or no knowledge documents, returns empty context gracefully.
 */
export const retrieveKnowledgeStep: PipelineStep = {
  name: "retrieve_knowledge",
  async run(ctx) {
    if (!ctx.normalized || !ctx.normalized.trim()) {
      return { kind: "continue" }
    }

    let results: RetrievalResult[] = []
    try {
      results = await retrieveRelevantKnowledge(ctx.normalized)
    } catch {
      // Fail gracefully — bot works without RAG context
      ctx.trace.set("knowledge_retrieved", 0)
      return { kind: "continue" }
    }

    ctx.knowledgeContext = results
    ctx.trace.set("knowledge_retrieved", results.length)

    return { kind: "continue" }
  },
}