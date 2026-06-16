import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { ApiResponse, PaginationParams, canTransition } from '../types/index.js';
import { success } from '../utils/helpers.js';
import { Prisma } from '@prisma/client';

// ─── Zod Schemas ─────────────────────────────────────────

export const createOrderSchema = z.object({
  merchantId: z.string().uuid(),
  customerId: z.string().uuid(),
  source: z.string().default('wa_chat'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      qty: z.number().int().positive(),
    }),
  ).min(1),
});

export const updateOrderSchema = z.object({
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const transitionOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type TransitionOrderInput = z.infer<typeof transitionOrderSchema>;

// ─── CRUD Methods ────────────────────────────────────────

export async function listOrders(
  merchantId: string,
  params: PaginationParams,
  filters?: { status?: string; customerId?: string },
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { merchantId };
    if (filters?.status) where.status = filters.status as any;
    if (filters?.customerId) where.customerId = filters.customerId;

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
          payment: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list orders';
    return { success: false, error: message };
  }
}

export async function getOrderById(id: string): Promise<ApiResponse> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        merchant: { select: { id: true, businessName: true } },
        items: {
          include: { product: { select: { id: true, name: true, price: true } } },
        },
        payment: true,
      },
    });
    if (!order) return { success: false, error: 'Order not found' };
    return success(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get order';
    return { success: false, error: message };
  }
}

export async function createOrder(input: CreateOrderInput): Promise<ApiResponse> {
  try {
    const parsed = createOrderSchema.parse(input);

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({ where: { id: parsed.merchantId } });
    if (!merchant) return { success: false, error: 'Merchant not found' };

    // Verify customer exists and belongs to merchant
    const customer = await prisma.customer.findFirst({
      where: { id: parsed.customerId, merchantId: parsed.merchantId },
    });
    if (!customer) return { success: false, error: 'Customer not found for this merchant' };

    // Verify products and calculate totals
    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData: {
      productId: string;
      qty: number;
      unitPrice: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }[] = [];

    for (const item of parsed.items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, merchantId: parsed.merchantId },
      });
      if (!product) {
        return { success: false, error: `Product ${item.productId} not found` };
      }
      if (!product.isAvailable) {
        return { success: false, error: `Product "${product.name}" is not available` };
      }
      if (product.stock < item.qty) {
        return { success: false, error: `Insufficient stock for "${product.name}"` };
      }

      const unitPrice = product.price;
      const subtotal = new Prisma.Decimal(item.qty).mul(unitPrice);
      totalAmount = totalAmount.add(subtotal);

      orderItemsData.push({
        productId: item.productId,
        qty: item.qty,
        unitPrice,
        subtotal,
      });
    }

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          merchantId: parsed.merchantId,
          customerId: parsed.customerId,
          totalAmount,
          source: parsed.source || 'wa_chat',
          notes: parsed.notes,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      });

      // Decrement stock for each item
      for (const item of parsed.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
      }

      // Increment customer order count
      await tx.customer.update({
        where: { id: parsed.customerId },
        data: { totalOrders: { increment: 1 } },
      });

      return created;
    });

    return success(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to create order';
    return { success: false, error: message };
  }
}

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<ApiResponse> {
  try {
    const parsed = updateOrderSchema.parse(input);

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Order not found' };

    const order = await prisma.order.update({
      where: { id },
      data: parsed,
      include: {
        items: true,
        payment: true,
        customer: true,
      },
    });
    return success(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to update order';
    return { success: false, error: message };
  }
}

export async function deleteOrder(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Order not found' };

    await prisma.order.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete order';
    return { success: false, error: message };
  }
}

// ─── State Machine ───────────────────────────────────────

export async function transitionOrderStatus(
  id: string,
  input: TransitionOrderInput,
): Promise<ApiResponse> {
  try {
    const parsed = transitionOrderSchema.parse(input);

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Order not found' };

    // Validate state transition
    if (!canTransition(existing.status, parsed.status)) {
      return {
        success: false,
        error: `Cannot transition order from ${existing.status} to ${parsed.status}`,
      };
    }

    // Business rules for specific transitions
    if (parsed.status === 'CANCELLED' && existing.status !== 'PENDING') {
      // Restore stock when cancelling a confirmed/processing order
      const items = await prisma.orderItem.findMany({
        where: { orderId: id },
      });

      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          });
        }

        await tx.order.update({
          where: { id },
          data: { status: parsed.status },
        });
      });
    } else {
      await prisma.order.update({
        where: { id },
        data: { status: parsed.status },
      });
    }

    const updated = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, customer: true },
    });

    return success(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to transition order status';
    return { success: false, error: message };
  }
}

// ─── Business Methods ────────────────────────────────────

export async function getPendingOrders(
  merchantId: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    return await listOrders(merchantId, params, { status: 'PENDING' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get pending orders';
    return { success: false, error: message };
  }
}

export async function getTodayOrders(
  merchantId: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const where = {
      merchantId,
      createdAt: { gte: todayStart },
    };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, payment: true },
      }),
      prisma.order.count({ where }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get today orders';
    return { success: false, error: message };
  }
}

export async function getOrderStats(merchantId: string): Promise<ApiResponse> {
  try {
    const [total, pending, confirmed, processing, completed, cancelled] = await Promise.all([
      prisma.order.count({ where: { merchantId } }),
      prisma.order.count({ where: { merchantId, status: 'PENDING' } }),
      prisma.order.count({ where: { merchantId, status: 'CONFIRMED' } }),
      prisma.order.count({ where: { merchantId, status: 'PROCESSING' } }),
      prisma.order.count({ where: { merchantId, status: 'COMPLETED' } }),
      prisma.order.count({ where: { merchantId, status: 'CANCELLED' } }),
    ]);

    return success({ total, pending, confirmed, processing, completed, cancelled });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get order stats';
    return { success: false, error: message };
  }
}
