import { z } from "zod"

export const createKnowledgeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  source: z.string().optional().nullable(),
})

export const updateKnowledgeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  source: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export const knowledgeQuerySchema = z.object({
  query: z.string().min(1).max(2000),
  topK: z.string().regex(/^\d+$/).optional().default("3"),
})