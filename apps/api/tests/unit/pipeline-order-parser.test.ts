import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    product: { findMany: mockFindMany },
    $transaction: mockTransaction,
  },
}));

vi.mock('../../src/config/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('processOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error for empty items', async () => {
    const { processOrder } = await import('../../src/pipeline/order-parser.js');
    const result = await processOrder('m1', 'c1', []);

    expect(result.error).toContain('Tidak ada item');
  });

  it('should return error when items undefined', async () => {
    const { processOrder } = await import('../../src/pipeline/order-parser.js');
    const result = await processOrder('m1', 'c1', undefined as unknown as []);

    expect(result.error).toContain('Tidak ada item');
  });

  it('should return errors for invalid product names', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 10 },
    ]);

    const { processOrder } = await import('../../src/pipeline/order-parser.js');
    const result = await processOrder('m1', 'c1', [
      { name: 'Nonexistent Item', qty: 1 },
      { name: 'Unknown', qty: 2 },
    ]);

    expect(result.error).toContain('Nonexistent Item');
    expect(result.error).toContain('Unknown');
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('should return error when no items are valid', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 10 },
    ]);

    const { processOrder } = await import('../../src/pipeline/order-parser.js');
    const result = await processOrder('m1', 'c1', [
      { name: 'Wrong Item', qty: 1 },
    ]);

    expect(result.error).toBeDefined();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('should return error for insufficient stock', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 2 },
    ]);

    const { processOrder } = await import('../../src/pipeline/order-parser.js');
    const result = await processOrder('m1', 'c1', [
      { name: 'Sate Ayam', qty: 10 },
    ]);

    expect(result.error).toContain('Stok');
    expect(result.error).toContain('Sate Ayam');
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('should create order with transaction successfully', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 20 },
      { id: 'p2', name: 'Es Teh', price: 5000, stock: 50 },
    ]);

    mockTransaction.mockImplementation(async (cb: (tx: Record<string, unknown>) => Promise<unknown>) => {
      const mockTx = {
        order: {
          create: vi.fn().mockResolvedValue({
            id: 'order-1',
            merchantId: 'm1',
            customerId: 'c1',
            totalAmount: 35000,
            notes: null,
            source: 'wa_chat',
            items: [
              { qty: 2, unitPrice: 15000, subtotal: 30000 },
              { qty: 1, unitPrice: 5000, subtotal: 5000 },
            ],
          }),
        },
        payment: { create: vi.fn().mockResolvedValue({}) },
        product: { update: vi.fn().mockResolvedValue({}) },
        customer: { update: vi.fn().mockResolvedValue({}) },
        activityLog: { create: vi.fn().mockResolvedValue({}) },
      };
      return cb(mockTx);
    });

    const { processOrder } = await import('../../src/pipeline/order-parser.js');
    const result = await processOrder('m1', 'c1', [
      { name: 'Sate Ayam', qty: 2 },
      { name: 'Es Teh', qty: 1 },
    ], 'notes test');

    expect(result.invoice).toBeDefined();
    expect(result.invoice).toContain('INVOICE');
    expect(result.invoice).toContain('Rp35.000');
  });

  it('should handle transaction failure gracefully', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 20 },
    ]);

    mockTransaction.mockRejectedValue(new Error('Database error'));

    const { processOrder } = await import('../../src/pipeline/order-parser.js');
    const result = await processOrder('m1', 'c1', [
      { name: 'Sate Ayam', qty: 1 },
    ]);

    expect(result.error).toContain('Gagal memproses pesanan');
  });

  it('should handle case-insensitive product matching', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 20 },
    ]);

    mockTransaction.mockImplementation(async (cb) => {
      const mockTx = {
        order: { create: vi.fn().mockResolvedValue({ id: 'order-1', totalAmount: 15000 }) },
        payment: { create: vi.fn().mockResolvedValue({}) },
        product: { update: vi.fn().mockResolvedValue({}) },
        customer: { update: vi.fn().mockResolvedValue({}) },
        activityLog: { create: vi.fn().mockResolvedValue({}) },
      };
      return cb(mockTx);
    });

    const { processOrder } = await import('../../src/pipeline/order-parser.js');
    const result = await processOrder('m1', 'c1', [
      { name: '  sate ayam  ', qty: 1 },
    ]);

    expect(result.invoice).toBeDefined();
  });

  it('should calculate total amount correctly', async () => {
    const products = [
      { id: 'p1', name: 'A', price: 10000, stock: 10 },
      { id: 'p2', name: 'B', price: 20000, stock: 10 },
      { id: 'p3', name: 'C', price: 5000, stock: 10 },
    ];
    mockFindMany.mockResolvedValue(products);

    mockTransaction.mockImplementation(async (cb) => {
      const mockTx = {
        order: {
          create: vi.fn().mockImplementation(async (args: { data: { totalAmount: number } }) => ({
            id: 'order-1',
            totalAmount: args.data.totalAmount,
            items: [],
          })),
        },
        payment: { create: vi.fn().mockResolvedValue({}) },
        product: { update: vi.fn().mockResolvedValue({}) },
        customer: { update: vi.fn().mockResolvedValue({}) },
        activityLog: { create: vi.fn().mockResolvedValue({}) },
      };
      return cb(mockTx);
    });

    const { processOrder } = await import('../../src/pipeline/order-parser.js');
    const result = await processOrder('m1', 'c1', [
      { name: 'A', qty: 3 },
      { name: 'C', qty: 2 },
    ]);

    expect(result.invoice).toContain('Rp40.000');
  });
});
