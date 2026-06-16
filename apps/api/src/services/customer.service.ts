import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { ApiResponse, PaginationParams } from '../types/index.js';
import { success } from '../utils/helpers.js';

// ─── Zod Schemas ─────────────────────────────────────────

export const createCustomerSchema = z.object({
  merchantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  phone: z.string().min(8).max(20),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(8).max(20).optional(),
  notes: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// ─── CRUD Methods ────────────────────────────────────────

export async function listCustomers(
  merchantId: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where: { merchantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where: { merchantId } }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list customers';
    return { success: false, error: message };
  }
}

export async function getCustomerById(id: string): Promise<ApiResponse> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { orders: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!customer) return { success: false, error: 'Customer not found' };
    return success(customer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get customer';
    return { success: false, error: message };
  }
}

export async function getCustomerByPhone(
  merchantId: string,
  phone: string,
): Promise<ApiResponse> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { merchantId_phone: { merchantId, phone } },
    });
    if (!customer) return { success: false, error: 'Customer not found' };
    return success(customer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to find customer';
    return { success: false, error: message };
  }
}

export async function createCustomer(input: CreateCustomerInput): Promise<ApiResponse> {
  try {
    const parsed = createCustomerSchema.parse(input);

    // Check merchant exists
    const merchant = await prisma.merchant.findUnique({ where: { id: parsed.merchantId } });
    if (!merchant) return { success: false, error: 'Merchant not found' };

    // Check for duplicate phone under same merchant
    const existing = await prisma.customer.findUnique({
      where: { merchantId_phone: { merchantId: parsed.merchantId, phone: parsed.phone } },
    });
    if (existing) return { success: false, error: 'Customer with this phone already exists for this merchant' };

    const customer = await prisma.customer.create({ data: parsed });
    return success(customer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to create customer';
    return { success: false, error: message };
  }
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<ApiResponse> {
  try {
    const parsed = updateCustomerSchema.parse(input);

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Customer not found' };

    const customer = await prisma.customer.update({
      where: { id },
      data: parsed,
    });
    return success(customer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to update customer';
    return { success: false, error: message };
  }
}

export async function deleteCustomer(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Customer not found' };

    await prisma.customer.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete customer';
    return { success: false, error: message };
  }
}

// ─── Business Methods ────────────────────────────────────

export async function incrementOrderCount(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Customer not found' };

    const customer = await prisma.customer.update({
      where: { id },
      data: { totalOrders: { increment: 1 } },
    });
    return success(customer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to increment order count';
    return { success: false, error: message };
  }
}

export async function getCustomerOrders(
  id: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Customer not found' };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, payment: true },
      }),
      prisma.order.count({ where: { customerId: id } }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get customer orders';
    return { success: false, error: message };
  }
}

export async function searchCustomers(
  merchantId: string,
  query: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where = {
      merchantId,
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { phone: { contains: query } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to search customers';
    return { success: false, error: message };
  }
}
