import { z } from "zod"

export const upsertQrSchema = z.object({
  qr: z.string().nullable().optional(),
  status: z.string().optional(),
  phone: z.string().nullable().optional(),
  pairingPhone: z.string().nullable().optional(),
  pairingCode: z.string().nullable().optional(),
})

export const pairingSchema = z.object({
  phone: z.string().regex(/^\d{10,15}$/, "Nomor telepon tidak valid"),
})
