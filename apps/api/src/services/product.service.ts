import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { ApiResponse, PaginationParams } from '../types/index.js';
import { success } from '../utils/helpers.js';

// ─── Zod Schemas ─────────────────────────────────────────

export const createProductSchema = z.object({
  merchantId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ─── CRUD Methods ────────────────────────────────────────

export async function listProducts(
  merchantId: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where: { merchantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.product.count({ where: { merchantId } }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list products';
    return { success: false, error: message };
  }
}

export async function getProductById(id: string): Promise<ApiResponse> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, merchant: true },
    });
    if (!product) return { success: false, error: 'Product not found' };
    return success(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get product';
    return { success: false, error: message };
  }
}

export async function createProduct(input: CreateProductInput): Promise<ApiResponse> {
  try {
    const parsed = createProductSchema.parse(input);

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({ where: { id: parsed.merchantId } });
    if (!merchant) return { success: false, error: 'Merchant not found' };

    // Verify category belongs to merchant if provided
    if (parsed.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: parsed.categoryId, merchantId: parsed.merchantId },
      });
      if (!category) return { success: false, error: 'Category not found for this merchant' };
    }

    const product = await prisma.product.create({
      data: {
        ...parsed,
        price: parsed.price,
      },
      include: { category: true },
    });
    return success(product);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to create product';
    return { success: false, error: message };
  }
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ApiResponse> {
  try {
    const parsed = updateProductSchema.parse(input);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Product not found' };

    if (parsed.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: parsed.categoryId, merchantId: existing.merchantId },
      });
      if (!category) return { success: false, error: 'Category not found for this merchant' };
    }

    const data: Record<string, unknown> = { ...parsed };
    if (parsed.price !== undefined) {
      data.price = parsed.price;
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
    return success(product);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to update product';
    return { success: false, error: message };
  }
}

export async function deleteProduct(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Product not found' };

    await prisma.product.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete product';
    return { success: false, error: message };
  }
}

// ─── Business Methods ────────────────────────────────────

export async function updateProductStock(
  id: string,
  quantity: number,
): Promise<ApiResponse> {
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Product not found' };

    const newStock = existing.stock + quantity;
    if (newStock < 0) return { success: false, error: 'Insufficient stock' };

    const product = await prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
    return success(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update stock';
    return { success: false, error: message };
  }
}

export async function toggleProductAvailability(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Product not found' };

    const product = await prisma.product.update({
      where: { id },
      data: { isAvailable: !existing.isAvailable },
    });
    return success(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to toggle availability';
    return { success: false, error: message };
  }
}

export async function searchProducts(
  merchantId: string,
  query: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where = {
      merchantId,
      name: { contains: query, mode: 'insensitive' as const },
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to search products';
    return { success: false, error: message };
  }
}

export async function getProductsByCategory(
  merchantId: string,
  categoryId: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where = { merchantId, categoryId };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get products by category';
    return { success: false, error: message };
  }
}

export async function getAvailableProducts(
  merchantId: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where = { merchantId, isAvailable: true, stock: { gt: 0 } };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get available products';
    return { success: false, error: message };
  }
}
