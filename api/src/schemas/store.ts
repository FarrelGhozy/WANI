import { z } from "zod"

export const upsertStoreSchema = z.object({
  businessName: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  businessHours: z.string().optional().nullable(),
  paymentMethods: z.string().optional().nullable(),
  shippingInfo: z.string().optional().nullable(),
  returnPolicy: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})
