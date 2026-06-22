import { z } from "zod"

export const chatRequestSchema = z.object({
  phone: z.string().min(1, "Phone is required"),
  name: z.string().optional(),
  text: z.string().min(1, "Text is required"),
  waMsgId: z.string().optional(),
})
