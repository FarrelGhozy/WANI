import { z } from "zod"

export const getTracesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
})

export const getTraceDetailParamsSchema = z.object({
  id: z.string().min(1, "Trace id is required"),
})
