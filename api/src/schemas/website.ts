import { z } from "zod"

export const updateWebsiteSchema = z.object({
  heroHeadline: z.string().optional(),
  heroSubheadline: z.string().optional(),
  aboutText: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color").optional(),
  phone: z.string().optional(),
  selectedProductIds: z.array(z.string()).optional(),
  template: z.string().optional(),
})

export const generateWebsiteSchema = z.object({
  template: z.string().default("default"),
})
