import { z } from "zod"

export const upsertAiConfigSchema = z.object({
  isActive: z.boolean().optional(),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
  greetingMessage: z.string().optional().nullable(),
  knowledgeBase: z.string().optional().nullable(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  llmBaseUrl: z.string().optional().nullable(),
  llmApiKey: z.string().optional().nullable(),
  fallbackModel: z.string().optional().nullable(),
})
