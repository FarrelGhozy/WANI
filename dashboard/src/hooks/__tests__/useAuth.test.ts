import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { mockFetchApi } = vi.hoisted(() => ({
  mockFetchApi: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  fetchApi: mockFetchApi,
}))

import { useAuth } from '../useAuth.ts'

const AUTH_TOKEN_KEY = 'wani_auth_token'
const AUTH_USER_KEY = 'wani_auth_user'

const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'admin' }
const mockToken = 'jwt-token-123'

describe('useAuth', () => {
  beforeEach(() => {
    mockFetchApi.mockReset()
    localStorage.clear()
  })

  describe('initial state', () => {
    it('starts with no user and not authenticated when localStorage is empty', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('isAuthenticated is true when token exists in localStorage', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken)
      const { result } = renderHook(() => useAuth())
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('login', () => {
    it('sets user and stores token on successful login', async () => {
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'Login berhasil',
        data: { token: mockToken, user: mockUser },
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(mockFetchApi).toHaveBeenCalledWith('/auth/login', expect.any(Object))
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.error).toBeNull()
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(mockToken)
      expect(localStorage.getItem(AUTH_USER_KEY)).toBe(JSON.stringify(mockUser))
    })

    it('sets error on login failure', async () => {
      mockFetchApi.mockRejectedValueOnce(new Error('Invalid credentials'))

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login('test@example.com', 'wrong')
      })

      expect(result.current.user).toBeNull()
      expect(result.current.error).toBe('Invalid credentials')
      expect(result.current.loading).toBe(false)
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
    })
  })

  describe('register', () => {
    it('returns true and stores token on successful registration', async () => {
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'Registrasi berhasil',
        data: { token: mockToken, user: mockUser },
      })

      const { result } = renderHook(() => useAuth())

      let returnedValue: boolean | undefined
      await act(async () => {
        returnedValue = await result.current.register('Test User', 'test@example.com', 'password123')
      })

      expect(returnedValue).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(mockToken)
    })

    it('returns false on registration failure', async () => {
      mockFetchApi.mockRejectedValueOnce(new Error('Email sudah terdaftar'))

      const { result } = renderHook(() => useAuth())

      let returnedValue: boolean | undefined
      await act(async () => {
        returnedValue = await result.current.register('Test User', 'test@example.com', 'password123')
      })

      expect(returnedValue).toBe(false)
      expect(result.current.error).toBe('Email sudah terdaftar')
    })
  })

  describe('auto-restore on mount', () => {
    it('fetches user when token exists in localStorage', async () => {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken)
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: mockUser,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      expect(mockFetchApi).toHaveBeenCalledWith('/auth/me')
    })

    it('clears token when auto-restore returns no data', async () => {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken)
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: null,
      })

      renderHook(() => useAuth())

      await waitFor(() => {
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
      })
    })

    it('clears token when auto-restore fails', async () => {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser))
      mockFetchApi.mockRejectedValueOnce(new Error('Token expired'))

      renderHook(() => useAuth())

      await waitFor(() => {
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
        expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull()
      })
    })
  })

  describe('logout', () => {
    it('clears user, token, and user data from localStorage', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser))

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull()
    })
  })
})
