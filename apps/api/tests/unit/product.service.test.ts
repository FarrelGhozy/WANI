import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMerchant, buildProduct } from '../helpers/factories.js';

vi.mock('../../src/config/prisma.js', () => {
  const mockPrisma = {
    product: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    merchant: { findUnique: vi.fn() },
    category: { findFirst: vi.fn() },
  };
  return { prisma: mockPrisma };
});

const { prisma } = await import('../../src/config/prisma.js');

describe('Product Service', () => {
  let merchant: ReturnType<typeof buildMerchant>;
  let product: ReturnType<typeof buildProduct>;

  beforeEach(() => {
    vi.clearAllMocks();
    merchant = buildMerchant();
    product = buildProduct(merchant.id);
  });

  describe('createProduct', () => {
    it('should create a product', async () => {
      const { createProduct } = await import('../../src/services/product.service.js');

      vi.mocked(prisma.merchant.findUnique).mockResolvedValue(merchant);
      vi.mocked(prisma.product.create).mockResolvedValue(product);

      const result = await createProduct({
        merchantId: merchant.id,
        name: 'Test Product',
        price: 15000,
        stock: 10,
      });

      expect(result.success).toBe(true);
    });

    it('should fail when merchant not found', async () => {
      const { createProduct } = await import('../../src/services/product.service.js');

      vi.mocked(prisma.merchant.findUnique).mockResolvedValue(null);

      const result = await createProduct({
        merchantId: 'nonexistent',
        name: 'Test',
        price: 10000,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateProductStock', () => {
    it('should update stock positively', async () => {
      const { updateProductStock } = await import('../../src/services/product.service.js');

      vi.mocked(prisma.product.findUnique).mockResolvedValue(product);

      const result = await updateProductStock(product.id, 5);

      expect(result.success).toBe(true);
    });

    it('should reject negative stock', async () => {
      const { updateProductStock } = await import('../../src/services/product.service.js');

      vi.mocked(prisma.product.findUnique).mockResolvedValue(product);

      const result = await updateProductStock(product.id, -20);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });
  });

  describe('searchProducts', () => {
    it('should filter products by keyword', async () => {
      const { searchProducts } = await import('../../src/services/product.service.js');

      vi.mocked(prisma.product.findMany).mockResolvedValue([product]);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const result = await searchProducts(merchant.id, 'test', { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });
  });

  describe('getAvailableProducts', () => {
    it('should return only available products with stock', async () => {
      const { getAvailableProducts } = await import('../../src/services/product.service.js');

      vi.mocked(prisma.product.findMany).mockResolvedValue([product]);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const result = await getAvailableProducts(merchant.id, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
    });
  });
});
