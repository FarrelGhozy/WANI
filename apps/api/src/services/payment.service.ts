import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { ApiResponse, PaginationParams } from '../types/index.js';
import { success } from '../utils/helpers.js';
import { createPaymentSchema, updatePaymentSchema } from '../lib/validation.js';
import type { CreatePaymentInput, UpdatePaymentInput } from '../lib/validation.js';

// ─── CRUD Methods ────────────────────────────────────────

export async function listPayments(
  merchantId: string,
  params: PaginationParams,
  filters?: { status?: string; method?: string },
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      order: { merchantId },
    };
    if (filters?.status) where.status = filters.status;
    if (filters?.method) where.method = filters.method;

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: { id: true, totalAmount: true, status: true, customerId: true },
          },
        },
      }),
      prisma.payment.count({ where: where as any }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list payments';
    return { success: false, error: message };
  }
}

export async function getPaymentById(id: string): Promise<ApiResponse> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            items: true,
          },
        },
      },
    });
    if (!payment) return { success: false, error: 'Payment not found' };
    return success(payment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get payment';
    return { success: false, error: message };
  }
}

export async function getPaymentByOrder(orderId: string): Promise<ApiResponse> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { order: { include: { customer: true } } },
    });
    if (!payment) return { success: false, error: 'Payment not found for this order' };
    return success(payment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get payment by order';
    return { success: false, error: message };
  }
}

export async function createPayment(input: CreatePaymentInput): Promise<ApiResponse> {
  try {
    const parsed = createPaymentSchema.parse(input);

    // Verify order exists
    const order = await prisma.order.findUnique({ where: { id: parsed.orderId } });
    if (!order) return { success: false, error: 'Order not found' };

    // Check if payment already exists for this order
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: parsed.orderId },
    });
    if (existingPayment) {
      return { success: false, error: 'Payment already exists for this order' };
    }

    // Validate amount matches order total (optional soft check)
    const orderAmount = Number(order.totalAmount);
    if (Math.abs(parsed.amount - orderAmount) > 0.01) {
      // Allow overpayment / partial? For now warn but proceed
      // We'll let it through but could be strict if needed
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: parsed.orderId,
        method: parsed.method,
        amount: parsed.amount,
        status: 'PENDING',
      },
      include: { order: true },
    });

    return success(payment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to create payment';
    return { success: false, error: message };
  }
}

export async function updatePayment(id: string, input: UpdatePaymentInput): Promise<ApiResponse> {
  try {
    const parsed = updatePaymentSchema.parse(input);

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Payment not found' };

    const data: Record<string, unknown> = { ...parsed };
    if (parsed.paidAt) {
      data.paidAt = new Date(parsed.paidAt);
    }

    const payment = await prisma.payment.update({
      where: { id },
      data,
      include: { order: true },
    });
    return success(payment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to update payment';
    return { success: false, error: message };
  }
}

export async function deletePayment(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Payment not found' };

    await prisma.payment.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete payment';
    return { success: false, error: message };
  }
}

// ─── Business Methods ────────────────────────────────────

export async function payOrder(
  orderId: string,
  method: 'CASH' | 'TRANSFER' | 'QRIS',
  amount?: number,
): Promise<ApiResponse> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) return { success: false, error: 'Order not found' };

    let payment = order.payment;

    if (!payment) {
      // Create new payment record
      payment = await prisma.payment.create({
        data: {
          orderId,
          method,
          amount: amount ?? order.totalAmount,
          status: 'PAID',
          paidAt: new Date(),
        },
      });
    } else {
      // Update existing payment
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          method,
          status: 'PAID',
          paidAt: new Date(),
          ...(amount !== undefined ? { amount } : {}),
        },
      });
    }

    return success(payment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process payment';
    return { success: false, error: message };
  }
}

export async function refundPayment(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Payment not found' };
    if (existing.status !== 'PAID') {
      return { success: false, error: 'Only paid payments can be refunded' };
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED' },
      include: { order: true },
    });

    return success(payment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to refund payment';
    return { success: false, error: message };
  }
}

export async function getPaymentStats(merchantId: string): Promise<ApiResponse> {
  try {
    const [totalPayments, totalPaid, totalPending, totalRefunded, totalFailed] =
      await Promise.all([
        prisma.payment.count({ where: { order: { merchantId } } }),
        prisma.payment.count({
          where: { order: { merchantId }, status: 'PAID' },
        }),
        prisma.payment.count({
          where: { order: { merchantId }, status: 'PENDING' },
        }),
        prisma.payment.count({
          where: { order: { merchantId }, status: 'REFUNDED' },
        }),
        prisma.payment.count({
          where: { order: { merchantId }, status: 'FAILED' },
        }),
      ]);

    // Aggregate total revenue from paid payments
    const revenueResult = await prisma.payment.aggregate({
      where: { order: { merchantId }, status: 'PAID' },
      _sum: { amount: true },
    });

    return success({
      totalPayments,
      totalPaid,
      totalPending,
      totalRefunded,
      totalFailed,
      totalRevenue: revenueResult._sum.amount ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get payment stats';
    return { success: false, error: message };
  }
}
