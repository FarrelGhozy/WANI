import { z } from "zod"

export const getTracesQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("50"),
})

export const getTraceDetailParamsSchema = z.object({
  id: z.string().min(1, "Trace id is required"),
})
