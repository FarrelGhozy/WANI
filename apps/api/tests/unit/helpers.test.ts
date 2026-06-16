import { describe, it, expect } from 'vitest';
import { formatPhone, formatCurrency } from '../../src/utils/helpers.js';

describe('Helpers', () => {
  describe('formatPhone', () => {
    it('should format Indonesian phone numbers', () => {
      expect(formatPhone('08123456789')).toBe('628123456789');
    });

    it('should handle numbers starting with +', () => {
      expect(formatPhone('+628123456789')).toBe('628123456789');
    });

    it('should keep already formatted numbers', () => {
      expect(formatPhone('628123456789')).toBe('628123456789');
    });
  });

  describe('formatCurrency', () => {
    it('should format number to IDR', () => {
      const result = formatCurrency(15000);
      expect(result).toContain('15');
      expect(result).toContain('000');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toContain('0');
    });
  });
});
