import type { Request, Response } from "express"
import type { z } from "zod"
import { ProductModel, CategoryModel } from "@/src/models/catalog"
import { sendResponse } from "@/src/utils/response"
import { NotFoundError } from "@/src/utils/errors"
import { createProductSchema, updateProductSchema, productQuerySchema, createCategorySchema, updateCategorySchema } from "@/src/schemas/product"

type CreateProductBody = z.infer<typeof createProductSchema>
type UpdateProductBody = z.infer<typeof updateProductSchema>
type ProductQuery = z.infer<typeof productQuerySchema>
type CreateCategoryBody = z.infer<typeof createCategorySchema>
type UpdateCategoryBody = z.infer<typeof updateCategorySchema>

export async function listProducts(
  req: Request<Record<string, string>, any, any, ProductQuery>,
  res: Response,
): Promise<void> {
  const result = await ProductModel.list((req as any).validatedQuery ?? req.query)
  sendResponse(res, 200, "products retrieved", result)
}

export async function getProduct(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const product = await ProductModel.getByIdWithCategory(req.params.id)
  if (!product) {
    throw new NotFoundError("product not found")
  }
  sendResponse(res, 200, "product retrieved", product)
}

export async function createProduct(
  req: Request<Record<string, string>, any, CreateProductBody>,
  res: Response,
): Promise<void> {
  const product = await ProductModel.createProduct(req.body)
  sendResponse(res, 201, "product created", product)
}

export async function updateProduct(
  req: Request<{ id: string }, any, UpdateProductBody>,
  res: Response,
): Promise<void> {
  const existing = await ProductModel.getByIdWithCategory(req.params.id)
  if (!existing) {
    throw new NotFoundError("product not found")
  }
  const product = await ProductModel.updateProduct(req.params.id, req.body)
  sendResponse(res, 200, "product updated", product)
}

export async function deleteProduct(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const existing = await ProductModel.getByIdWithCategory(req.params.id)
  if (!existing) {
    throw new NotFoundError("product not found")
  }
  await ProductModel.deleteProduct(req.params.id)
  sendResponse(res, 200, "product deleted")
}

export async function listCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  const items = await CategoryModel.listAll()
  sendResponse(res, 200, "categories retrieved", { items })
}

export async function createCategory(
  req: Request<Record<string, string>, any, CreateCategoryBody>,
  res: Response,
): Promise<void> {
  const category = await CategoryModel.createCategory(req.body)
  sendResponse(res, 201, "category created", category)
}

export async function updateCategory(
  req: Request<{ id: string }, any, UpdateCategoryBody>,
  res: Response,
): Promise<void> {
  const existing = await CategoryModel.getByIdWithCount(req.params.id)
  if (!existing) {
    throw new NotFoundError("category not found")
  }
  const category = await CategoryModel.updateCategory(req.params.id, req.body)
  sendResponse(res, 200, "category updated", category)
}

export async function deleteCategory(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const existing = await CategoryModel.getByIdWithCount(req.params.id)
  if (!existing) {
    throw new NotFoundError("category not found")
  }
  await CategoryModel.deleteCategory(req.params.id)
  sendResponse(res, 200, "category deleted")
}
