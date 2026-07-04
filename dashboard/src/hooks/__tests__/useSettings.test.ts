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

import { useSettings } from '../useSettings'
import type { StoreProfile, AiConfig } from '@/types'

const mockStore: StoreProfile = {
  id: 's1',
  businessName: 'Toko WANI',
  address: 'Jl. Merdeka No. 1',
  phone: '08123456789',
  logoUrl: null,
  businessHours: null,
  paymentMethods: null,
  shippingInfo: null,
  returnPolicy: null,
  isActive: true,
}

const mockAiConfig: AiConfig = {
  id: 'ai1',
  isActive: true,
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: 'You are helpful',
  greetingMessage: null,
  knowledgeBase: null,
}

function setupConfigFetch(store = mockStore, aiConfig = mockAiConfig) {
  mockFetchApi.mockImplementation(async (url: string) => {
    if (url === '/store') {
      return { status: 'success', message: 'ok', data: store }
    }
    if (url === '/ai-config') {
      return { status: 'success', message: 'ok', data: aiConfig }
    }
    return { status: 'success', message: 'ok', data: null }
  })
}

describe('useSettings', () => {
  beforeEach(() => {
    mockFetchApi.mockReset()
  })

  describe('initial load', () => {
    it('fetches store and ai-config in parallel', async () => {
      setupConfigFetch()

      const { result } = renderHook(() => useSettings())

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.store).toEqual(mockStore)
      expect(result.current.aiConfig).toEqual(mockAiConfig)
      expect(mockFetchApi).toHaveBeenCalledWith('/store')
      expect(mockFetchApi).toHaveBeenCalledWith('/ai-config')
      expect(result.current.error).toBeNull()
    })

    it('sets error on fetch failure', async () => {
      mockFetchApi.mockRejectedValueOnce(new Error('Server error'))

      const { result } = renderHook(() => useSettings())

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe('Server error')
      expect(result.current.store).toBeNull()
    })
  })

  describe('updateStore', () => {
    it('updates store profile', async () => {
      setupConfigFetch()
      const updatedStore = { ...mockStore, businessName: 'WANI Super' }
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: updatedStore,
      })

      const { result } = renderHook(() => useSettings())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: updatedStore,
      })

      await act(async () => {
        await result.current.updateStore({ businessName: 'WANI Super' })
      })

      expect(mockFetchApi).toHaveBeenCalledWith('/store', expect.objectContaining({ method: 'PUT' }))
      expect(result.current.store!.businessName).toBe('WANI Super')
    })

    it('sets error on update failure', async () => {
      setupConfigFetch()

      const { result } = renderHook(() => useSettings())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      mockFetchApi.mockRejectedValueOnce(new Error('Validation error'))

      await act(async () => {
        try {
          await result.current.updateStore({ businessName: '' })
        } catch {
          // re-thrown
        }
      })

      expect(result.current.error).toBe('Validation error')
    })
  })

  describe('updateAiConfig', () => {
    it('updates AI config', async () => {
      setupConfigFetch()
      const updatedAi = { ...mockAiConfig, temperature: 0.9 }
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: updatedAi,
      })

      const { result } = renderHook(() => useSettings())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: updatedAi,
      })

      await act(async () => {
        await result.current.updateAiConfig({ temperature: 0.9 })
      })

      expect(mockFetchApi).toHaveBeenCalledWith('/ai-config', expect.objectContaining({ method: 'PUT' }))
      expect(result.current.aiConfig!.temperature).toBe(0.9)
    })

    it('sets error on update failure', async () => {
      setupConfigFetch()

      const { result } = renderHook(() => useSettings())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      mockFetchApi.mockRejectedValueOnce(new Error('Save failed'))

      await act(async () => {
        try {
          await result.current.updateAiConfig({ temperature: 3.0 })
        } catch {
          // re-thrown
        }
      })

      expect(result.current.error).toBe('Save failed')
    })
  })

  describe('reload', () => {
    it('re-fetches both configs and clears error', async () => {
      setupConfigFetch()

      const { result } = renderHook(() => useSettings())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      setupConfigFetch()

      await act(async () => {
        await result.current.reload()
      })

      expect(result.current.store).toEqual(mockStore)
      expect(result.current.aiConfig).toEqual(mockAiConfig)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })
})
