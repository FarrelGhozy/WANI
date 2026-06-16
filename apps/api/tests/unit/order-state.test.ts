import { describe, it, expect } from 'vitest';
import { canTransition, ORDER_TRANSITIONS } from '../../src/types/index.js';

describe('Order State Machine', () => {
  it('should allow valid transitions', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransition('PENDING', 'CANCELLED')).toBe(true);
    expect(canTransition('CONFIRMED', 'PROCESSING')).toBe(true);
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
    expect(canTransition('PROCESSING', 'COMPLETED')).toBe(true);
    expect(canTransition('PROCESSING', 'CANCELLED')).toBe(true);
  });

  it('should deny invalid transitions', () => {
    expect(canTransition('PENDING', 'COMPLETED')).toBe(false);
    expect(canTransition('PENDING', 'PROCESSING')).toBe(false);
    expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
    expect(canTransition('CANCELLED', 'PENDING')).toBe(false);
    expect(canTransition('COMPLETED', 'PENDING')).toBe(false);
  });

  it('should have dead-end states', () => {
    expect(ORDER_TRANSITIONS.COMPLETED).toHaveLength(0);
    expect(ORDER_TRANSITIONS.CANCELLED).toHaveLength(0);
  });

  it('should NOT allow PENDING → PROCESSING (skip confirm)', () => {
    expect(canTransition('PENDING', 'PROCESSING')).toBe(false);
  });
});
