import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMerchant } from '../helpers/factories.js';

vi.mock('../../src/config/prisma.js', () => {
  const mockPrisma = {
    merchant: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    product: { count: vi.fn() },
    order: { count: vi.fn() },
    customer: { count: vi.fn() },
  };
  return { prisma: mockPrisma };
});

const { prisma } = await import('../../src/config/prisma.js');

describe('Merchant Service', () => {
  let merchant: ReturnType<typeof buildMerchant>;

  beforeEach(() => {
    vi.clearAllMocks();
    merchant = buildMerchant();
  });

  describe('getMerchantById', () => {
    it('should return merchant by id', async () => {
      const { getMerchantById } = await import('../../src/services/merchant.service.js');

      vi.mocked(prisma.merchant.findUnique).mockResolvedValue(merchant);

      const result = await getMerchantById(merchant.id);
      expect(result.success).toBe(true);
    });

    it('should return error when not found', async () => {
      const { getMerchantById } = await import('../../src/services/merchant.service.js');

      vi.mocked(prisma.merchant.findUnique).mockResolvedValue(null);

      const result = await getMerchantById('00000000-0000-4000-a000-000000000099');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
