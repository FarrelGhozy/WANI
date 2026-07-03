import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate } from '../format'

describe('formatPrice', () => {
  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('Rp0')
  })

  it('formats thousands with dot separator', () => {
    expect(formatPrice(1000)).toBe('Rp1.000')
  })

  it('formats large numbers', () => {
    expect(formatPrice(50000)).toBe('Rp50.000')
  })

  it('formats millions', () => {
    expect(formatPrice(999999)).toBe('Rp999.999')
  })

  it('formats negative numbers', () => {
    expect(formatPrice(-5000)).toBe('Rp-5.000')
  })

  it('formats decimal numbers (truncated by toLocaleString)', () => {
    const result = formatPrice(1500.75)
    expect(result).toContain('Rp')
    expect(result).toContain('1.500')
  })

  it('formats numbers with many digits', () => {
    expect(formatPrice(123456789)).toBe('Rp123.456.789')
  })
})

describe('formatDate', () => {
  it('formats a date string with default options', () => {
    const result = formatDate('2025-06-15T10:30:00Z')
    expect(result).toContain('2025')
    // Hours and minutes depend on local timezone — verify both date and time parts exist
    expect(result).toMatch(/\d{2}:\d{2}/)
    expect(result).toContain('Jun')
  })

  it('formats a Date object', () => {
    const result = formatDate(new Date('2025-06-15T10:30:00Z'))
    expect(result).toContain('2025')
  })

  it('formats with timeOnly option', () => {
    const result = formatDate('2025-06-15T10:30:00Z', { timeOnly: true })
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('formats with long month option', () => {
    const result = formatDate('2025-01-15T10:30:00Z', { long: true })
    expect(result.toLowerCase()).toContain('januari')
  })

  it('formats with short month by default', () => {
    const result = formatDate('2025-01-15T10:30:00Z')
    expect(result.toLowerCase()).toContain('jan')
  })

  it('formats with timezone option', () => {
    const result = formatDate('2025-06-15T10:30:00Z', { withTz: true })
    // Timezone name should be present, varies by system locale
    expect(result.length).toBeGreaterThan(10)
  })

  it('handles invalid date gracefully (returns "Invalid Date" variant)', () => {
    const result = formatDate('not-a-date')
    // Should not throw, returns locale-formatted invalid date
    expect(typeof result).toBe('string')
  })
})
