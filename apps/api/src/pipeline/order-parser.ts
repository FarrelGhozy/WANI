import { OrderItemInput } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { formatInvoice } from '../utils/wa-formatter.js';

// ─── Types ─────────────────────────────────────────────

export interface OrderResult {
  invoice?: string;
  error?: string;
}

/**
 * Process an order from LLM-parsed items:
 * 1. Validate each item against DB products (match by name, case-insensitive).
 * 2. Calculate totals.
 * 3. Create Order + OrderItems + Payment in a Prisma transaction.
 * 4. Return a formatted invoice string.
 *
 * Uses prisma directly with try/catch (services layer comes later).
 */
export async function processOrder(
  merchantId: string,
  customerId: string,
  items: OrderItemInput[],
  notes?: string,
): Promise<OrderResult> {
  if (!items || items.length === 0) {
    return { error: 'Tidak ada item dalam pesanan. Silakan sebutkan produk yang ingin dipesan.' };
  }

  // ── 1. Validate items against DB ────────────────────
  const dbProducts = await prisma.product.findMany({
    where: { merchantId, isAvailable: true },
    select: { id: true, name: true, price: true, stock: true },
  });

  const orderItems: Array<{
    productId: string;
    name: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }> = [];

  const errors: string[] = [];

  for (const item of items) {
    const product = dbProducts.find(
      (p: { id: string; name: string; price: unknown; stock: number }) =>
        p.name.toLowerCase() === item.name.trim().toLowerCase(),
    );

    if (!product) {
      errors.push(`Produk "${item.name}" tidak ditemukan.`);
      continue;
    }

    if (product.stock < item.qty) {
      errors.push(
        `Stok "${product.name}" tidak mencukupi (tersedia: ${product.stock}, diminta: ${item.qty}).`,
      );
      continue;
    }

    const unitPrice = Number(product.price);
    orderItems.push({
      productId: product.id,
      name: product.name,
      qty: item.qty,
      unitPrice,
      subtotal: unitPrice * item.qty,
    });
  }

  if (orderItems.length === 0) {
    const errorMsg = errors.length > 0
      ? errors.join('\n')
      : 'Tidak ada item yang valid untuk diproses.';
    return { error: errorMsg };
  }

  // ── 2. Calculate totals ────────────────────────────
  const totalAmount = orderItems.reduce((sum, oi) => sum + oi.subtotal, 0);

  // ── 3. Create in transaction ───────────────────────
  try {
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const created = await tx.order.create({
        data: {
          merchantId,
          customerId,
          totalAmount,
          notes: notes ?? null,
          source: 'wa_chat',
          items: {
            create: orderItems.map((oi) => ({
              productId: oi.productId,
              qty: oi.qty,
              unitPrice: oi.unitPrice,
              subtotal: oi.subtotal,
            })),
          },
        },
        include: {
          items: {
            select: { qty: true, unitPrice: true, subtotal: true },
          },
        },
      });

      // Create payment record (PENDING)
      await tx.payment.create({
        data: {
          orderId: created.id,
          amount: totalAmount,
          status: 'PENDING',
        },
      });

      // Update customer total orders
      await tx.customer.update({
        where: { id: customerId },
        data: { totalOrders: { increment: 1 } },
      });

      return created;
    });

    logger.info({ orderId: order.id, totalAmount }, 'Order created successfully');

    // ── 4. Format invoice ──────────────────────────────
    const invoice = formatInvoice({
      id: order.id,
      items: orderItems.map((oi) => ({
        name: oi.name,
        qty: oi.qty,
        subtotal: oi.subtotal,
      })),
      totalAmount,
    });

    return { invoice };
  } catch (err) {
    logger.error({ err, merchantId, customerId, items }, 'Order transaction failed');
    return { error: 'Gagal memproses pesanan. Silakan coba lagi.' };
  }
}
