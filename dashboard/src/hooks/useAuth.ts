import { useState, useCallback, useEffect } from 'react'
import { fetchApi } from '@/lib/api.ts'

export interface User {
  id: string
  name: string
  email: string
  role: string
}

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
      const json = await fetchApi<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const { token, user: userData } = json.data!
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
      setUser(userData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return

    const init = async () => {
      setLoading(true)
      try {
        const json = await fetchApi<User>('/api/auth/me')
        if (json.data) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(json.data))
          setUser(json.data)
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          localStorage.removeItem(AUTH_USER_KEY)
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const json = await fetchApi<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const { token, user: userData } = json.data!
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
      setUser(userData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setUser(null)
  }, [])

  return { user, isAuthenticated, login, register, logout, loading, error }
}
