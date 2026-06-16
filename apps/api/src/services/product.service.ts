import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { ApiResponse, PaginationParams } from '../types/index.js';
import { success } from '../utils/helpers.js';
import { createProductSchema, updateProductSchema } from '../lib/validation.js';
import type { CreateProductInput, UpdateProductInput } from '../lib/validation.js';

// ─── CRUD Methods ────────────────────────────────────────

interface ProductFilterParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}

export async function listProducts(
  merchantId: string,
  params: ProductFilterParams,
): Promise<ApiResponse> {
  try {
    const { page, limit, search, categoryId, isAvailable } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { merchantId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

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
