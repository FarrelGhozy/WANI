import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMerchant, buildCustomer, buildProduct, buildOrder } from '../helpers/factories.js';

vi.mock('../../src/config/prisma.js', () => {
  const mockPrisma = {
    order: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
    orderItem: { create: vi.fn() },
    product: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    customer: { findFirst: vi.fn(), update: vi.fn() },
    merchant: { findUnique: vi.fn() },
    payment: { create: vi.fn(), findFirst: vi.fn() },
    activityLog: { create: vi.fn() },
    $transaction: vi.fn((fn: (tx: any) => any) => fn(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

const { prisma } = await import('../../src/config/prisma.js');

async function loadService() {
  const mod = await import('../../src/services/order.service.js');
  return mod;
}

describe('Order Service', () => {
  let merchant: ReturnType<typeof buildMerchant>;
  let customer: ReturnType<typeof buildCustomer>;
  let product: ReturnType<typeof buildProduct>;
  let order: ReturnType<typeof buildOrder>;

  beforeEach(() => {
    vi.clearAllMocks();
    merchant = buildMerchant();
    customer = buildCustomer(merchant.id);
    product = buildProduct(merchant.id, { price: 15000, stock: 10 });
    order = buildOrder(merchant.id, customer.id);
  });

  describe('createOrder', () => {
    it('should create order with items and payment', async () => {
      const { createOrder } = await loadService();

      vi.mocked(prisma.merchant.findUnique).mockResolvedValue(merchant);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(customer);
      vi.mocked(prisma.product.findFirst).mockResolvedValue(product);
      vi.mocked(prisma.order.create).mockResolvedValue({ ...order, items: [], customer });
      vi.mocked(prisma.product.update).mockResolvedValue({ ...product, stock: product.stock - 2 });
      vi.mocked(prisma.customer.update).mockResolvedValue({ ...customer, totalOrders: 1 });

      const result = await createOrder({
        merchantId: merchant.id,
        customerId: customer.id,
        items: [{ productId: product.id, qty: 2 }],
      });

      expect(result.success).toBe(true);
    });

    it('should fail when merchant not found', async () => {
      const { createOrder } = await loadService();
      vi.mocked(prisma.merchant.findUnique).mockResolvedValue(null);

      const result = await createOrder({
        merchantId: '00000000-0000-4000-a000-000000000001',
        customerId: customer.id,
        items: [{ productId: product.id, qty: 2 }],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Merchant not found');
    });

    it('should fail when stock insufficient', async () => {
      const { createOrder } = await loadService();

      vi.mocked(prisma.merchant.findUnique).mockResolvedValue(merchant);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(customer);
      vi.mocked(prisma.product.findFirst).mockResolvedValue({ ...product, id: product.id, stock: 1 });

      const result = await createOrder({
        merchantId: merchant.id,
        customerId: customer.id,
        items: [{ productId: product.id, qty: 5 }],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });
  });

  describe('status transitions', () => {
    it('should allow valid transition: PENDING -> CONFIRMED', async () => {
      const { transitionOrderStatus } = await loadService();

      vi.mocked(prisma.order.findUnique).mockResolvedValue(order);

      const result = await transitionOrderStatus(order.id, { status: 'CONFIRMED' as any });

      expect(result.success).toBe(true);
    });

    it('should reject invalid transition: PENDING -> PROCESSING', async () => {
      const { transitionOrderStatus } = await loadService();

      vi.mocked(prisma.order.findUnique).mockResolvedValue(order);

      const result = await transitionOrderStatus(order.id, { status: 'PROCESSING' as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition');
    });

    it('should reject transition for CANCELLED orders', async () => {
      const { transitionOrderStatus } = await loadService();

      vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...order, status: 'CANCELLED' });

      const result = await transitionOrderStatus(order.id, { status: 'CONFIRMED' as any });

      expect(result.success).toBe(false);
    });
  });

  describe('listOrders', () => {
    it('should return paginated orders', async () => {
      const { listOrders } = await loadService();

      vi.mocked(prisma.order.findMany).mockResolvedValue([order]);
      vi.mocked(prisma.order.count).mockResolvedValue(1);

      const result = await listOrders(merchant.id, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });
  });
});
