import { z } from "zod"

export const upsertQrSchema = z.object({
  qr: z.string().optional(),
  status: z.string().optional(),
  phone: z.string().optional(),
  pairingPhone: z.string().optional(),
  pairingCode: z.string().optional(),
})

export const pairingSchema = z.object({
  phone: z.string().regex(/^\d{10,15}$/, "Nomor telepon tidak valid"),
})
