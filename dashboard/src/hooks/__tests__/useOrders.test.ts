import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { mockFetchApi } = vi.hoisted(() => ({
  mockFetchApi: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  fetchApi: mockFetchApi,
}))

vi.mock('@/hooks/useToast', async () => {
  const actual = await vi.importActual('@/hooks/useToast')
  return { ...actual }
})

import { useOrders } from '../useOrders.ts'
import type { Order } from '@/types.ts'

const mockApiOrder = {
  id: 'order-001',
  customerId: 'c1',
  customer: { id: 'c1', name: 'Budi', phone: '08123456789' },
  status: 'PENDING',
  totalAmount: 75000,
  source: 'whatsapp',
  notes: null,
  items: [
    {
      id: 'oi1',
      productId: 'p1',
      product: { id: 'p1', name: 'Nasi Goreng' },
      qty: 2,
      unitPrice: 25000,
      subtotal: 50000,
    },
    {
      id: 'oi2',
      productId: 'p2',
      product: { id: 'p2', name: 'Es Teh' },
      qty: 5,
      unitPrice: 5000,
      subtotal: 25000,
    },
  ],
  payment: null,
  createdAt: '2025-06-01T10:00:00Z',
  updatedAt: '2025-06-01T10:00:00Z',
}

const mockApiOrder2 = {
  ...mockApiOrder,
  id: 'order-002',
  customer: { id: 'c2', name: 'Ani', phone: '08987654321' },
  status: 'COMPLETED',
  totalAmount: 50000,
}

function setupOrderFetch(orders = [mockApiOrder, mockApiOrder2]) {
  mockFetchApi.mockResolvedValueOnce({
    status: 'success',
    message: 'ok',
    data: { items: orders, total: orders.length },
  })
}

describe('useOrders', () => {
  beforeEach(() => {
    mockFetchApi.mockReset()
  })

  describe('initial load + mapping', () => {
    it('fetches and maps orders correctly', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.allOrders).toHaveLength(2)
      expect(result.current.allOrders[0]).toMatchObject({
        id: 'order-001',
        customerName: 'Budi',
        customerPhone: '08123456789',
      })
      expect(result.current.allOrders[0].items[0].productName).toBe('Nasi Goreng')
      expect(mockFetchApi).toHaveBeenCalledWith('/orders?limit=100')
    })
  })

  describe('status filter', () => {
    it('filters by status', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setStatusFilter('COMPLETED')
      })

      expect(result.current.orders).toHaveLength(1)
      expect(result.current.orders[0].status).toBe('COMPLETED')
    })
  })

  describe('search', () => {
    it('filters by customer name', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSearch('ani')
      })

      expect(result.current.orders).toHaveLength(1)
      expect(result.current.orders[0].customerName).toBe('Ani')
    })

    it('filters by order id', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSearch('order-001')
      })

      expect(result.current.orders).toHaveLength(1)
    })
  })

  describe('sort by status priority', () => {
    it('sorts by status priority — toggle flips direction', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      // Default: status asc (PENDING first)
      expect(result.current.sortField).toBe('status')
      expect(result.current.sortDir).toBe('asc')
      expect(result.current.orders[0].status).toBe('PENDING')

      // Toggle same field → flips to desc (COMPLETED first)
      act(() => {
        result.current.toggleSort('status')
      })

      expect(result.current.sortDir).toBe('desc')
      expect(result.current.orders[0].status).toBe('COMPLETED')
    })
  })

  describe('nextStatuses', () => {
    it('returns allowed transitions for PENDING', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      const next = result.current.nextStatuses('order-001')
      expect(next).toEqual(['CONFIRMED', 'CANCELLED'])
    })

    it('returns empty array for COMPLETED', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      const next = result.current.nextStatuses('order-002')
      expect(next).toEqual([])
    })

    it('returns empty array for unknown order', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      const next = result.current.nextStatuses('unknown')
      expect(next).toEqual([])
    })
  })

  describe('updateStatus', () => {
    it('updates status via API for valid transition', async () => {
      setupOrderFetch()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: { ...mockApiOrder, status: 'CONFIRMED' },
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.updateStatus('order-001', 'CONFIRMED')
      })

      expect(mockFetchApi).toHaveBeenCalledWith('/orders/order-001/status', expect.any(Object))
      expect(result.current.getOrder('order-001')!.status).toBe('CONFIRMED')
    })

    it('returns undefined for invalid transition', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      let returned: Order | undefined
      await act(async () => {
        // COMPLETED has no allowed transitions
        returned = await result.current.updateStatus('order-001', 'COMPLETED')
      })

      expect(returned).toBeUndefined()
      // statusFlow: PENDING → COMPLETED is NOT allowed
    })

    it('returns undefined for unknown order', async () => {
      setupOrderFetch()

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      let returned: Order | undefined
      await act(async () => {
        returned = await result.current.updateStatus('unknown', 'CONFIRMED')
      })

      expect(returned).toBeUndefined()
    })

    it('sets error on API failure', async () => {
      setupOrderFetch()
      mockFetchApi.mockRejectedValueOnce(new Error('Server error'))

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        try {
          await result.current.updateStatus('order-001', 'CONFIRMED')
        } catch {
          // re-thrown
        }
      })

      expect(result.current.error).toBe('Server error')
    })
  })

  describe('confirmPayment', () => {
    it('confirms payment and updates state', async () => {
      setupOrderFetch()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: {
          ...mockApiOrder,
          status: 'CONFIRMED',
          payment: { method: 'TRANSFER', amount: 75000, status: 'PAID', paidAt: '2025-06-01T11:00:00Z' },
        },
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.confirmPayment('order-001', { method: 'TRANSFER', amount: 75000 })
      })

      expect(mockFetchApi).toHaveBeenCalledWith('/orders/order-001/payment', expect.any(Object))
      expect(result.current.getOrder('order-001')!.payment).toBeDefined()
      expect(result.current.getOrder('order-001')!.payment!.status).toBe('PAID')
    })
  })
})
