import { z } from "zod"

const orderStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"] as const
const paymentMethods = ["CASH", "TRANSFER", "QRIS", "E_WALLET"] as const
const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const

export const orderStatusSchema = z.enum(orderStatuses)
export const paymentMethodSchema = z.enum(paymentMethods)
export const paymentStatusSchema = z.enum(paymentStatuses)

export const orderQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1"),
  limit: z.string().regex(/^\d+$/).optional().default("20"),
  status: orderStatusSchema.optional(),
  customerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(["createdAt", "updatedAt", "totalAmount", "status"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
})

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
})

export const updateOrderNotesSchema = z.object({
  notes: z.string(),
})

export const updateOrderPaymentSchema = z.object({
  method: paymentMethodSchema,
  amount: z.number().min(0),
  status: paymentStatusSchema,
  paidAt: z.string().optional().nullable(),
})
