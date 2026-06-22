import { useState, useEffect, useCallback } from 'react'
import { fetchApi } from '../lib/api.ts'

export interface WaStatus {
  qr: string | null
  connection: string
  phone: string | null
  loading: boolean
  error: string | null
}

const MOCK = true

export function useWaStatus(pollInterval = 5000): WaStatus {
  if (MOCK) {
    return { qr: 'mock-qr-data-for-development', connection: 'disconnected', phone: null, loading: false, error: null }
  }

  const [qr, setQr] = useState<string | null>(null)
  const [connection, setConnection] = useState('disconnected')
  const [phone, setPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const poll = useCallback(async () => {
    try {
      const [qrRes, statusRes] = await Promise.all([
        fetchApi<{ qr: string | null }>('/api/qr'),
        fetchApi<{ status: string; phone: string | null }>('/api/qr/status'),
      ])
      setQr(qrRes.data?.qr ?? null)
      setConnection(statusRes.data?.status ?? 'disconnected')
      setPhone(statusRes.data?.phone ?? null)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(poll, pollInterval)
    const initialId = setTimeout(poll, 0)
    return () => {
      clearInterval(id)
      clearTimeout(initialId)
    }
  }, [poll, pollInterval])

  return { qr, connection, phone, loading, error }
}
