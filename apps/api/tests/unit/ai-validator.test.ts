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

const { prisma } = await import('../../src/config/prisma.js');

describe('AI Validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateLLMOutput', () => {
    it('should parse valid greeting JSON', async () => {
      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        '{"intent": "greeting", "reply": "Halo!"}',
      );

      expect(result.validation.valid).toBe(true);
      expect(result.data?.intent).toBe('greeting');
      expect(result.retriesLeft).toBe(2);
    });

    it('should parse valid inquiry JSON', async () => {
      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        '{"intent": "inquiry", "query": "Berapa harga?"}',
      );

      expect(result.validation.valid).toBe(true);
      expect(result.data?.intent).toBe('inquiry');
    });

    it('should parse valid order JSON without merchantId (skip product check)', async () => {
      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        '{"intent": "order", "items": [{"name": "Sate Ayam", "qty": 2}]}',
      );

      expect(result.validation.valid).toBe(true);
      expect(result.data?.intent).toBe('order');
      expect(mockFindMany).not.toHaveBeenCalled();
    });

    it('should reject invalid JSON string', async () => {
      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput('not valid json');

      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toContain('Failed to parse LLM output as JSON');
      expect(result.data).toBeNull();
    });

    it('should reject JSON missing required fields', async () => {
      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput('{"intent": "greeting"}');

      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some((e: string) => e.includes('reply'))).toBe(true);
    });

    it('should reject unknown intent value', async () => {
      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        '{"intent": "unknown_intent"}',
      );

      expect(result.validation.valid).toBe(false);
    });

    it('should compute retriesLeft based on attempt number', async () => {
      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput('invalid', { attempt: 1 });

      expect(result.retriesLeft).toBe(1);
    });

    it('should return retriesLeft 0 on last attempt', async () => {
      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput('invalid', { attempt: 2 });

      expect(result.retriesLeft).toBe(0);
    });
  });

  describe('validateLLMOutput with product resolution', () => {
    it('should resolve valid order items against product DB', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'prod-1', name: 'Sate Ayam', stock: 20, isAvailable: true },
      ]);

      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        '{"intent": "order", "items": [{"name": "Sate Ayam", "qty": 2}]}',
        { merchantId: 'merchant-1' },
      );

      expect(result.validation.valid).toBe(true);
      expect(result.resolvedItems).toEqual([{ productId: 'prod-1', qty: 2 }]);
    });

    it('should report product not found', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'prod-1', name: 'Sate Ayam', stock: 20, isAvailable: true },
      ]);

      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        '{"intent": "order", "items": [{"name": "Nonexistent", "qty": 1}]}',
        { merchantId: 'merchant-1' },
      );

      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toContain('Product not found: "Nonexistent"');
    });

    it('should report product unavailable', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'prod-1', name: 'Sate Ayam', stock: 20, isAvailable: false },
      ]);

      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        '{"intent": "order", "items": [{"name": "Sate Ayam", "qty": 1}]}',
        { merchantId: 'merchant-1' },
      );

      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toContain(
        'Product "Sate Ayam" is currently unavailable',
      );
    });

    it('should report insufficient stock', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'prod-1', name: 'Sate Ayam', stock: 2, isAvailable: true },
      ]);

      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        '{"intent": "order", "items": [{"name": "Sate Ayam", "qty": 10}]}',
        { merchantId: 'merchant-1' },
      );

      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors[0]).toContain('Insufficient stock');
      expect(result.validation.errors[0]).toContain('requested 10');
      expect(result.validation.errors[0]).toContain('available 2');
    });

    it('should aggregate multiple product errors', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'prod-1', name: 'Sate Ayam', stock: 100, isAvailable: true },
      ]);

      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        JSON.stringify({
          intent: 'order',
          items: [
            { name: 'Sate Ayam', qty: 2 },
            { name: 'Unknown Product', qty: 1 },
            { name: 'Unavailable Product', qty: 1 },
          ],
        }),
        { merchantId: 'merchant-1' },
      );

      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toHaveLength(2);
      expect(result.resolvedItems).toEqual([{ productId: 'prod-1', qty: 2 }]);
    });

    it('should perform case-insensitive product matching', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'prod-1', name: 'Sate Ayam', stock: 20, isAvailable: true },
      ]);

      const { validateLLMOutput } = await import('../../src/ai/validator.js');
      const result = await validateLLMOutput(
        '{"intent": "order", "items": [{"name": "sate ayam", "qty": 1}]}',
        { merchantId: 'merchant-1' },
      );

      expect(result.validation.valid).toBe(true);
      expect(result.resolvedItems).toHaveLength(1);
    });
  });

  describe('validateWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const { validateWithRetry } = await import('../../src/ai/validator.js');
      const getContent = vi.fn().mockResolvedValue(
        '{"intent": "greeting", "reply": "Halo!"}',
      );

      const result = await validateWithRetry(getContent, 'merchant-1');
      expect(result.data?.intent).toBe('greeting');
      expect(getContent).toHaveBeenCalledOnce();
    });

    it('should retry on validation failure and succeed', async () => {
      const { validateWithRetry } = await import('../../src/ai/validator.js');
      const getContent = vi
        .fn()
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValueOnce('{"intent": "greeting", "reply": "Halo!"}');

      const result = await validateWithRetry(getContent, 'merchant-1');
      expect(result.data?.intent).toBe('greeting');
      expect(getContent).toHaveBeenCalledTimes(2);
    });

    it('should pass error feedback on retry', async () => {
      const { validateWithRetry } = await import('../../src/ai/validator.js');
      const feedbacks: Array<string | null> = [];
      const getContent = vi.fn().mockImplementation(async (feedback: string | null) => {
        feedbacks.push(feedback);
        if (feedback === null) return 'invalid json';
        return '{"intent": "greeting", "reply": "Halo!"}';
      });

      await validateWithRetry(getContent, 'merchant-1');
      expect(feedbacks[0]).toBeNull();
      expect(feedbacks[1]).toContain('Failed to parse LLM output as JSON');
    });

    it('should throw ValidationError after exhausting retries', async () => {
      const { validateWithRetry, ValidationError } = await import('../../src/ai/validator.js');
      const getContent = vi.fn().mockResolvedValue('invalid json');

      await expect(validateWithRetry(getContent, 'merchant-1')).rejects.toThrow(ValidationError);
      expect(getContent).toHaveBeenCalledTimes(3);
    });

    it('should include error details in final ValidationError message', async () => {
      const { validateWithRetry } = await import('../../src/ai/validator.js');
      const getContent = vi.fn().mockResolvedValue('not json');

      await expect(validateWithRetry(getContent, 'merchant-1')).rejects.toThrow(
        'LLM output validation failed after 3 attempt(s)',
      );
    });

    it('should handle order intent with product resolution across retries', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'prod-1', name: 'Sate Ayam', stock: 20, isAvailable: true },
        { id: 'prod-2', name: 'Es Teh', stock: 50, isAvailable: true },
      ]);

      const { validateWithRetry } = await import('../../src/ai/validator.js');
      const getContent = vi.fn().mockResolvedValue(
        JSON.stringify({
          intent: 'order',
          items: [
            { name: 'Sate Ayam', qty: 2 },
            { name: 'Es Teh', qty: 1 },
          ],
        }),
      );

      const result = await validateWithRetry(getContent, 'merchant-1');
      expect(result.data?.intent).toBe('order');
      expect(result.resolvedItems).toHaveLength(2);
    });
  });

  describe('resolveProducts', () => {
    it('should resolve multiple valid products', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'p1', name: 'Sate Ayam', stock: 10, isAvailable: true },
        { id: 'p2', name: 'Es Teh', stock: 20, isAvailable: true },
      ]);

      const { resolveProducts } = await import('../../src/ai/validator.js');
      const result = await resolveProducts('merchant-1', [
        { name: 'Sate Ayam', qty: 2 },
        { name: 'Es Teh', qty: 1 },
      ]);

      expect(result.validItems).toEqual([
        { productId: 'p1', qty: 2 },
        { productId: 'p2', qty: 1 },
      ]);
      expect(result.errors).toHaveLength(0);
    });

    it('should report product not found', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'p1', name: 'Sate Ayam', stock: 10, isAvailable: true },
      ]);

      const { resolveProducts } = await import('../../src/ai/validator.js');
      const result = await resolveProducts('merchant-1', [
        { name: 'Nonexistent', qty: 1 },
      ]);

      expect(result.validItems).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Nonexistent');
    });

    it('should match product names case-insensitively with trimming', async () => {
      mockFindMany.mockResolvedValue([
        { id: 'p1', name: 'Sate Ayam', stock: 10, isAvailable: true },
      ]);

      const { resolveProducts } = await import('../../src/ai/validator.js');
      const result = await resolveProducts('merchant-1', [
        { name: '  SATE AYAM  ', qty: 1 },
      ]);

      expect(result.validItems).toHaveLength(1);
    });
  });
});
