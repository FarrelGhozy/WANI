import { describe, it, expect } from 'vitest';
import { LLMOutputSchema } from '../../src/ai/schemas.js';

describe('LLMOutputSchema', () => {
  describe('order intent', () => {
    it('should accept valid order with multiple items', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'order',
        items: [{ name: 'Nasi Goreng', qty: 2 }, { name: 'Es Teh', qty: 1 }],
      });
      expect(result.success).toBe(true);
    });

    it('should accept order with optional notes', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'order',
        items: [{ name: 'Bakso', qty: 1 }],
        notes: 'Pedas',
      });
      expect(result.success).toBe(true);
    });

    it('should reject order with empty items', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'order',
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject order with negative qty', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'order',
        items: [{ name: 'Nasi', qty: -1 }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject order with empty product name', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'order',
        items: [{ name: '', qty: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject order with zero qty', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'order',
        items: [{ name: 'Nasi', qty: 0 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('inquiry intent', () => {
    it('should accept valid inquiry', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'inquiry',
        query: 'Berapa harga produk A?',
      });
      expect(result.success).toBe(true);
    });

    it('should reject inquiry with empty query', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'inquiry',
        query: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('greeting intent', () => {
    it('should accept valid greeting', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'greeting',
        reply: 'Halo! Ada yang bisa dibantu?',
      });
      expect(result.success).toBe(true);
    });

    it('should reject greeting with empty reply', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'greeting',
        reply: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('complaint intent', () => {
    it('should accept valid complaint without escalation', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'complaint',
        reply: 'Maaf atas ketidaknyamanannya.',
        escalate: false,
      });
      expect(result.success).toBe(true);
    });

    it('should accept complaint with escalation', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'complaint',
        reply: 'Kami akan segera menindaklanjuti.',
        escalate: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject complaint without escalate field', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'complaint',
        reply: 'Maaf.',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('unknown intent', () => {
    it('should accept valid unknown', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'unknown',
        reply: 'Maaf, saya tidak mengerti.',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('escalate intent', () => {
    it('should accept valid escalate', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'escalate',
        reason: 'Customer ingin bicara dengan admin',
      });
      expect(result.success).toBe(true);
    });

    it('should reject escalate with empty reason', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'escalate',
        reason: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing intent field', () => {
      const result = LLMOutputSchema.safeParse({
        items: [{ name: 'Nasi', qty: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject unknown intent value', () => {
      const result = LLMOutputSchema.safeParse({
        intent: 'invalid_intent',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-object input', () => {
      const result = LLMOutputSchema.safeParse('not an object');
      expect(result.success).toBe(false);
    });

    it('should reject null input', () => {
      const result = LLMOutputSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});
