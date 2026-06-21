import { z } from "zod"

export const upsertQrSchema = z.object({
  qr: z.string().optional(),
  status: z.string().optional(),
  phone: z.string().optional(),
})
