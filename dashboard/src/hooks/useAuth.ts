import { useState, useCallback, useEffect } from 'react'
import { fetchApi } from '@/lib/api.ts'
import { getErrorMessage } from '@/hooks/useToast.ts'
import type { User } from '@/types.ts'

export type { User }

const AUTH_TOKEN_KEY = 'wani_auth_token'
const AUTH_USER_KEY = 'wani_auth_user'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!localStorage.getItem(AUTH_TOKEN_KEY)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const json = await fetchApi<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!json.data) throw new Error(json.message || 'Login gagal: data kosong')
      const { token, user: userData } = json.data
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
      setUser(userData)
    } catch (e) {
      const msg = getErrorMessage(e, 'Login gagal')
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return

    let cancelled = false

    ;(async () => {
      try {
        const json = await fetchApi<User>('/auth/me')
        if (!cancelled) {
          if (json.data) {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(json.data))
            setUser(json.data)
          } else {
            localStorage.removeItem(AUTH_TOKEN_KEY)
            localStorage.removeItem(AUTH_USER_KEY)
          }
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          localStorage.removeItem(AUTH_USER_KEY)
        }
      }
    })()

    return () => { cancelled = true }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      return true
    } catch (e) {
      setError(getErrorMessage(e, 'Registrasi gagal'))
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const resendVerification = useCallback(async (email: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await fetchApi('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch (e) {
      const msg = getErrorMessage(e, 'Gagal mengirim ulang verifikasi')
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setUser(null)
  }, [])

  return { user, isAuthenticated, login, register, logout, loading, error, resendVerification }
}
