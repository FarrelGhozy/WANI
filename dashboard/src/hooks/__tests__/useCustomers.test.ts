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

import { useCustomers } from '../useCustomers.ts'
import type { Customer } from '@/types.ts'

const mockCustomer: Customer = {
  id: 'c1',
  name: 'Budi',
  phone: '08123456789',
  notes: null,
  unreadCount: 2,
  totalOrders: 3,
  lastMessage: null,
  recentOrder: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

const mockCustomer2: Customer = {
  ...mockCustomer,
  id: 'c2',
  name: 'Ani',
  phone: '08987654321',
  unreadCount: 0,
}

function setupCustomerFetch(customers: Customer[] = [mockCustomer, mockCustomer2]) {
  mockFetchApi.mockResolvedValueOnce({
    status: 'success',
    message: 'ok',
    data: { items: customers, total: customers.length },
  })
}

describe('useCustomers', () => {
  beforeEach(() => {
    mockFetchApi.mockReset()
  })

  describe('initial load', () => {
    it('fetches customers on mount', async () => {
      setupCustomerFetch()

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.customers).toHaveLength(2)
      expect(result.current.allCustomers).toHaveLength(2)
      expect(mockFetchApi).toHaveBeenCalledWith('/customers?limit=100')
    })

    it('sets error on fetch failure', async () => {
      mockFetchApi.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe('Network error')
    })
  })

  describe('search filter', () => {
    it('filters by name', async () => {
      setupCustomerFetch()

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSearch('budi')
      })

      expect(result.current.customers).toHaveLength(1)
      expect(result.current.customers[0].name).toBe('Budi')
    })

    it('filters by phone', async () => {
      setupCustomerFetch()

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSearch('08987654321')
      })

      expect(result.current.customers).toHaveLength(1)
      expect(result.current.customers[0].name).toBe('Ani')
    })

    it('returns all when search is empty', async () => {
      setupCustomerFetch()

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSearch('')
      })

      expect(result.current.customers).toHaveLength(2)
    })
  })

  describe('selected customer', () => {
    it('returns null when no customer selected', async () => {
      setupCustomerFetch()

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.selected).toBeNull()
    })

    it('returns selected customer by id', async () => {
      setupCustomerFetch()

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSelectedId('c2')
      })

      expect(result.current.selected).toBeDefined()
      expect(result.current.selected!.name).toBe('Ani')
    })
  })

  describe('conversation loading', () => {
    it('loads conversation when customer selected', async () => {
      setupCustomerFetch()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: {
          id: 'c1',
          phone: '08123456789',
          name: 'Budi',
          notes: null,
          totalOrders: 3,
          orders: [],
          conversation: {
            id: 'conv-1',
            status: 'OPEN',
            messages: [
              { id: 'm1', role: 'user', content: 'Halo', msgType: 'text', waMsgId: null, metadata: null, createdAt: '2025-06-01T10:00:00Z' },
            ],
          },
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      })

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSelectedId('c1')
      })

      await waitFor(() => expect(result.current.convLoading).toBe(false))

      expect(mockFetchApi).toHaveBeenCalledWith('/customers/c1')
      expect(result.current.conversation).toBeDefined()
      expect(result.current.conversation!.messages).toHaveLength(1)
      expect(result.current.conversation!.messages[0].content).toBe('Halo')
    })

    it('sets conversation to null when customer has no conversation', async () => {
      setupCustomerFetch()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: {
          id: 'c1',
          phone: '08123456789',
          name: 'Budi',
          notes: null,
          totalOrders: 3,
          orders: [],
          conversation: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      })

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSelectedId('c1')
      })

      await waitFor(() => expect(result.current.convLoading).toBe(false))

      expect(result.current.conversation).toBeNull()
    })

    it('clears conversation when deselected', async () => {
      setupCustomerFetch()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: {
          id: 'c1',
          phone: '08123456789',
          name: 'Budi',
          notes: null,
          totalOrders: 3,
          orders: [],
          conversation: {
            id: 'conv-1',
            status: 'OPEN',
            messages: [],
          },
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      })

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      // Select then deselect
      act(() => {
        result.current.setSelectedId('c1')
      })

      await waitFor(() => expect(result.current.convLoading).toBe(false))

      act(() => {
        result.current.setSelectedId(null)
      })

      expect(result.current.conversation).toBeNull()
    })
  })

  describe('sendMessage', () => {
    it('sends message and appends to conversation', async () => {
      setupCustomerFetch()
      mockFetchApi
        .mockResolvedValueOnce({
          status: 'success',
          message: 'ok',
          data: {
            id: 'c1',
            phone: '08123456789',
            name: 'Budi',
            notes: null,
            totalOrders: 3,
            orders: [],
            conversation: {
              id: 'conv-1',
              status: 'OPEN',
              messages: [],
            },
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        })
        .mockResolvedValueOnce({
          status: 'success',
          message: 'ok',
          data: { id: 'm2', role: 'assistant', content: 'Baik kak', createdAt: '2025-06-01T10:01:00Z' },
        })

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSelectedId('c1')
      })

      await waitFor(() => expect(result.current.convLoading).toBe(false))
      expect(result.current.conversation).toBeDefined()

      await act(async () => {
        await result.current.sendMessage('Baik kak')
      })

      expect(mockFetchApi).toHaveBeenCalledWith(
        '/conversations/conv-1/messages',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(result.current.conversation!.messages).toHaveLength(1)
    })

    it('does nothing when no conversation is loaded', async () => {
      setupCustomerFetch()

      const { result } = renderHook(() => useCustomers())

      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.sendMessage('Test')
      })

      // No additional fetch calls besides the initial load
      expect(mockFetchApi).toHaveBeenCalledTimes(1)
    })
  })
})
