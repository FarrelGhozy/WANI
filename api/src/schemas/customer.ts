import { z } from "zod"

const convStatuses = ["ACTIVE", "RESOLVED", "ARCHIVED", "ESCALATED"] as const

export const customerQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1"),
  limit: z.string().regex(/^\d+$/).optional().default("20"),
  search: z.string().optional(),
  sort: z.enum(["createdAt", "updatedAt", "name", "totalOrders"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
})

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
})

export const updateConversationStatusSchema = z.object({
  status: z.enum(convStatuses),
})

export const sendMessageSchema = z.object({
  text: z.string().min(1),
})
