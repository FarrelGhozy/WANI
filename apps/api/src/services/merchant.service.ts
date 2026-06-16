import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { ApiResponse, PaginationParams } from '../types/index.js';
import { success } from '../utils/helpers.js';

// ─── Zod Schemas ─────────────────────────────────────────

export const createMerchantSchema = z.object({
  businessName: z.string().min(1).max(200),
  phone: z.string().min(8).max(20),
  address: z.string().optional(),
  passwordHash: z.string().optional(),
});

export const updateMerchantSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  phone: z.string().min(8).max(20).optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;
export type UpdateMerchantInput = z.infer<typeof updateMerchantSchema>;

// ─── CRUD Methods ────────────────────────────────────────

export async function listMerchants(
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.merchant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.merchant.count(),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list merchants';
    return { success: false, error: message };
  }
}

export async function getMerchantById(id: string): Promise<ApiResponse> {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { id } });
    if (!merchant) return { success: false, error: 'Merchant not found' };
    return success(merchant);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get merchant';
    return { success: false, error: message };
  }
}

export async function getMerchantByPhone(phone: string): Promise<ApiResponse> {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { phone } });
    if (!merchant) return { success: false, error: 'Merchant not found' };
    return success(merchant);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to find merchant';
    return { success: false, error: message };
  }
}

export async function createMerchant(input: CreateMerchantInput): Promise<ApiResponse> {
  try {
    const parsed = createMerchantSchema.parse(input);

    const existing = await prisma.merchant.findUnique({ where: { phone: parsed.phone } });
    if (existing) return { success: false, error: 'A merchant with this phone already exists' };

    const merchant = await prisma.merchant.create({ data: parsed });
    return success(merchant);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to create merchant';
    return { success: false, error: message };
  }
}

export async function updateMerchant(id: string, input: UpdateMerchantInput): Promise<ApiResponse> {
  try {
    const parsed = updateMerchantSchema.parse(input);

    const existing = await prisma.merchant.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Merchant not found' };

    if (parsed.phone && parsed.phone !== existing.phone) {
      const phoneTaken = await prisma.merchant.findUnique({ where: { phone: parsed.phone } });
      if (phoneTaken) return { success: false, error: 'Phone already in use by another merchant' };
    }

    const merchant = await prisma.merchant.update({
      where: { id },
      data: parsed,
    });
    return success(merchant);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to update merchant';
    return { success: false, error: message };
  }
}

export async function deleteMerchant(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.merchant.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Merchant not found' };

    await prisma.merchant.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete merchant';
    return { success: false, error: message };
  }
}

// ─── Business Methods ────────────────────────────────────

export async function toggleMerchantActive(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.merchant.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Merchant not found' };

    const merchant = await prisma.merchant.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    return success(merchant);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to toggle merchant status';
    return { success: false, error: message };
  }
}

export async function getMerchantStats(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.merchant.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Merchant not found' };

    const [productCount, customerCount, orderCount, pendingOrderCount] = await Promise.all([
      prisma.product.count({ where: { merchantId: id } }),
      prisma.customer.count({ where: { merchantId: id } }),
      prisma.order.count({ where: { merchantId: id } }),
      prisma.order.count({ where: { merchantId: id, status: 'PENDING' } }),
    ]);

    return success({
      productCount,
      customerCount,
      orderCount,
      pendingOrderCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get merchant stats';
    return { success: false, error: message };
  }
}
