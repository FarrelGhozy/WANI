import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMerchant, buildWebStore } from '../helpers/factories.js';

vi.mock('../../src/config/prisma.js', () => {
  const mockPrisma = {
    webStore: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    template: { findMany: vi.fn(), findUnique: vi.fn() },
  };
  return { prisma: mockPrisma };
});

const { prisma } = await import('../../src/config/prisma.js');

describe('Web Store Service', () => {
  let merchant: ReturnType<typeof buildMerchant>;
  let store: ReturnType<typeof buildWebStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    merchant = buildMerchant();
    store = buildWebStore(merchant.id);
  });

  describe('getWebStore', () => {
    it('should return existing store', async () => {
      const { getWebStore } = await import('../../src/services/web-store.service.js');

      vi.mocked(prisma.webStore.findUnique).mockResolvedValue(store);

      const result = await getWebStore(merchant.id);

      expect(result.success).toBe(true);
    });

    it('should create store if not exists', async () => {
      const { getWebStore } = await import('../../src/services/web-store.service.js');

      vi.mocked(prisma.webStore.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.webStore.create).mockResolvedValue(store);

      const result = await getWebStore(merchant.id);

      expect(result.success).toBe(true);
    });
  });

  describe('publishWebStore', () => {
    it('should set isPublished to true', async () => {
      const { publishWebStore } = await import('../../src/services/web-store.service.js');

      vi.mocked(prisma.webStore.update).mockResolvedValue({ ...store, isPublished: true });

      const result = await publishWebStore(merchant.id);

      expect(result.success).toBe(true);
    });
  });

  describe('getWebStoreBySlug', () => {
    it('should return published store by slug', async () => {
      const { getWebStoreBySlug } = await import('../../src/services/web-store.service.js');

      vi.mocked(prisma.webStore.findUnique).mockResolvedValue({
        ...store,
        isPublished: true,
        merchant: { businessName: 'Test', phone: '62812', address: null, categories: [] },
      });

      const result = await getWebStoreBySlug('test-store');

      expect(result.success).toBe(true);
    });

    it('should return error for unpublished store', async () => {
      const { getWebStoreBySlug } = await import('../../src/services/web-store.service.js');

      vi.mocked(prisma.webStore.findUnique).mockResolvedValue(null);

      const result = await getWebStoreBySlug('unpublished-store');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
