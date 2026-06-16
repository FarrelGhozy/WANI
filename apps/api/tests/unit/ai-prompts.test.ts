import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../../src/ai/prompts.js';

const baseMerchant = {
  businessName: 'Warung Sate',
  address: 'Jl. Merdeka No. 1',
  phone: '6281234567890',
};

describe('buildSystemPrompt', () => {
  it('should include business name and phone', () => {
    const result = buildSystemPrompt(baseMerchant, []);
    expect(result).toContain('Warung Sate');
    expect(result).toContain('6281234567890');
    expect(result).toContain('Jl. Merdeka No. 1');
  });

  it('should handle missing address gracefully', () => {
    const result = buildSystemPrompt({ ...baseMerchant, address: null }, []);
    expect(result).toContain('Not specified');
  });

  it('should include empty catalog message when no products', () => {
    const result = buildSystemPrompt(baseMerchant, []);
    expect(result).toContain('No products registered yet');
  });

  it('should include available products in catalog', () => {
    const products = [
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 20, isAvailable: true, categoryName: null },
      { id: 'p2', name: 'Sate Kambing', price: 25000, stock: 10, isAvailable: true, categoryName: 'Premium' },
    ];
    const result = buildSystemPrompt(baseMerchant, products);
    expect(result).toContain('Sate Ayam');
    expect(result).toContain('Sate Kambing');
    expect(result).toContain('[Premium]');
    expect(result).toContain('Rp15.000');
    expect(result).toContain('20 in stock');
  });

  it('should exclude unavailable products from catalog', () => {
    const products = [
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 20, isAvailable: true, categoryName: null },
      { id: 'p2', name: 'Sate Kambing', price: 25000, stock: 0, isAvailable: false, categoryName: null },
    ];
    const result = buildSystemPrompt(baseMerchant, products);
    expect(result).toContain('Sate Ayam');
    expect(result).not.toContain('Sate Kambing');
  });

  it('should mark out of stock items', () => {
    const products = [
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 0, isAvailable: true, categoryName: null },
    ];
    const result = buildSystemPrompt(baseMerchant, products);
    expect(result).toContain('OUT OF STOCK');
  });

  it('should show empty available message when all products unavailable', () => {
    const products = [
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 0, isAvailable: false, categoryName: null },
    ];
    const result = buildSystemPrompt(baseMerchant, products);
    expect(result).toContain('No products currently available');
  });

  it('should include knowledge base about business hours', () => {
    const result = buildSystemPrompt(baseMerchant, []);
    expect(result).toContain('08:00–17:00 WIB');
  });

  it('should include payment methods from knowledge base', () => {
    const result = buildSystemPrompt(baseMerchant, []);
    expect(result).toContain('Cash');
    expect(result).toContain('Bank Transfer');
    expect(result).toContain('QRIS');
  });

  it('should include strict JSON output rules', () => {
    const result = buildSystemPrompt(baseMerchant, []);
    expect(result).toContain('valid JSON only');
    expect(result).toContain('no markdown fences');
    expect(result).toContain('intent');
  });

  it('should include all six intent schemas in output rules', () => {
    const result = buildSystemPrompt(baseMerchant, []);
    expect(result).toContain('"order"');
    expect(result).toContain('"inquiry"');
    expect(result).toContain('"greeting"');
    expect(result).toContain('"complaint"');
    expect(result).toContain('"unknown"');
    expect(result).toContain('"escalate"');
  });

  it('should format prices with ID locale', () => {
    const products = [
      { id: 'p1', name: 'Nasi Goreng', price: 2500000, stock: 5, isAvailable: true, categoryName: null },
    ];
    const result = buildSystemPrompt(baseMerchant, products);
    expect(result).toContain('Rp2.500.000');
  });
});
