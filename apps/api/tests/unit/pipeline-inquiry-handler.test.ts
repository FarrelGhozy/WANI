import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.fn();

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    product: { findMany: mockFindMany },
  },
}));

vi.mock('../../src/config/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('handleInquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show all available products when query is "menu"', async () => {
    mockFindMany.mockResolvedValue([
      { name: 'Sate Ayam', price: 15000, stock: 10 },
      { name: 'Es Teh', price: 5000, stock: 20 },
    ]);

    const { handleInquiry } = await import('../../src/pipeline/inquiry-handler.js');
    const result = await handleInquiry('m1', 'menu');

    expect(result).toContain('Sate Ayam');
    expect(result).toContain('Es Teh');
    expect(result).toContain('Rp15.000');
    expect(result).toContain('Rp5.000');
  });

  it('should show all products when query triggers list keywords', async () => {
    mockFindMany.mockResolvedValue([
      { name: 'Nasi Goreng', price: 20000, stock: 5 },
    ]);

    const { handleInquiry } = await import('../../src/pipeline/inquiry-handler.js');
    const results = await Promise.all([
      handleInquiry('m1', 'produk'),
      handleInquiry('m1', 'daftar'),
      handleInquiry('m1', 'list'),
      handleInquiry('m1', 'product'),
    ]);

    for (const r of results) {
      expect(r).toContain('Nasi Goreng');
    }
  });

  it('should return empty state when no products available', async () => {
    mockFindMany.mockResolvedValue([]);

    const { handleInquiry } = await import('../../src/pipeline/inquiry-handler.js');
    const result = await handleInquiry('m1', 'menu');

    expect(result).toContain('Belum ada produk tersedia');
  });

  it('should search products by keyword', async () => {
    mockFindMany.mockImplementation(async ({ where }) => {
      if (where.OR) {
        return [
          { name: 'Sate Ayam', price: 15000, stock: 10 },
        ];
      }
      return [];
    });

    const { handleInquiry } = await import('../../src/pipeline/inquiry-handler.js');
    const result = await handleInquiry('m1', 'sate');

    expect(result).toContain('Sate Ayam');
  });

  it('should return no-results message when keyword search fails', async () => {
    mockFindMany.mockResolvedValue([]);

    const { handleInquiry } = await import('../../src/pipeline/inquiry-handler.js');
    const result = await handleInquiry('m1', 'xyz');

    expect(result).toContain('tidak ada produk yang cocok');
    expect(result).toContain('MENU');
  });

  it('should only query available products with stock > 0 for menu', async () => {
    mockFindMany.mockResolvedValue([]);

    const { handleInquiry } = await import('../../src/pipeline/inquiry-handler.js');
    await handleInquiry('m1', 'menu');

    const callArgs = mockFindMany.mock.calls[0][0];
    expect(callArgs.where.isAvailable).toBe(true);
    expect(callArgs.where.stock.gt).toBe(0);
  });

  it('should filter out short keywords (< 2 chars)', async () => {
    mockFindMany.mockReset();
    mockFindMany.mockResolvedValue([
      { name: 'Sate Ayam', price: 15000, stock: 10 },
    ]);

    const { handleInquiry } = await import('../../src/pipeline/inquiry-handler.js');
    const result = await handleInquiry('m1', 'a b sate');

    expect(result).toContain('Sate Ayam');
  });

  it('should limit results to 50 products', async () => {
    mockFindMany.mockResolvedValue([]);

    const { handleInquiry } = await import('../../src/pipeline/inquiry-handler.js');
    await handleInquiry('m1', 'menu');

    expect(mockFindMany.mock.calls[0][0].take).toBe(50);
  });

  it('should handle database error gracefully', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const { handleInquiry } = await import('../../src/pipeline/inquiry-handler.js');
    const result = await handleInquiry('m1', 'menu');

    expect(result).toContain('Maaf, terjadi kesalahan');
  });
});
