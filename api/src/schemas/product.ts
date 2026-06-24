import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  stock: z.number().int().min(0).optional().default(0),
  isAvailable: z.boolean().optional().default(true),
  imageUrl: z.string().optional().nullable(),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  imageUrl: z.string().optional().nullable(),
})

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isAvailable: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sort: z.enum(["name", "price", "stock", "createdAt", "updatedAt"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
})

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
})
