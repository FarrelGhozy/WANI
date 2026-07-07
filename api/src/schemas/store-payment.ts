import { z } from "zod"

const paymentMethodBaseSchema = z.object({
  label: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const qrisSchema = paymentMethodBaseSchema.extend({
  type: z.literal("QRIS"),
  qrImageUrl: z.string().min(1, "QRIS image wajib diupload"),
})

const bankTransferSchema = paymentMethodBaseSchema.extend({
  type: z.literal("BANK_TRANSFER"),
  bankName: z.string().min(1, "Nama bank wajib diisi"),
  accountNumber: z.string().min(1, "No rekening wajib diisi"),
  accountName: z.string().min(1, "Nama pemilik rekening wajib diisi"),
})

const ewalletSchema = paymentMethodBaseSchema.extend({
  type: z.literal("E_WALLET"),
  providerName: z.string().min(1, "Nama provider wajib diisi"),
  phoneNumber: z.string().min(1, "No HP wajib diisi"),
  accountName: z.string().optional().nullable(),
})

const codSchema = paymentMethodBaseSchema.extend({
  type: z.literal("COD"),
  instructions: z.string().min(1, "Instruksi COD wajib diisi"),
})

export const createPaymentMethodSchema = z.discriminatedUnion("type", [
  qrisSchema,
  bankTransferSchema,
  ewalletSchema,
  codSchema,
])

export const updatePaymentMethodSchema = z.object({
  label: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  qrImageUrl: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional().nullable(),
  providerName: z.string().optional(),
  phoneNumber: z.string().optional(),
})

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>
