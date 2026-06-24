import { z } from "zod"

const orderStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"] as const
const paymentMethods = ["CASH", "TRANSFER", "QRIS"] as const
const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const

export const orderStatusSchema = z.enum(orderStatuses)
export const paymentMethodSchema = z.enum(paymentMethods)
export const paymentStatusSchema = z.enum(paymentStatuses)

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: orderStatusSchema.optional(),
  customerId: z.string().optional(),
  dateFrom: z.coerce.string().optional(),
  dateTo: z.coerce.string().optional(),
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
