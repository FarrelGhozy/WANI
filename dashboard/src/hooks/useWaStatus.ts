import { useState, useEffect, useCallback } from 'react'
import { fetchApi } from '../lib/api.ts'

export interface WaStatus {
  qr: string
  connection: string
  phone: string
  loading: boolean
  error: string | null
}

const MOCK = true

export function useWaStatus(pollInterval = 5000): WaStatus {
  const [qr, setQr] = useState(MOCK ? 'mock-qr-data-for-development' : '')
  const [connection, setConnection] = useState(MOCK ? 'connected' : 'disconnected')
  const [phone, setPhone] = useState(MOCK ? '+6281234567890' : '')
  const [loading, setLoading] = useState(!MOCK)
  const [error, setError] = useState<string | null>(null)

  const poll = useCallback(async () => {
    try {
      const [qrRes, statusRes] = await Promise.all([
        fetchApi<{ qr: string | null }>('/api/qr'),
        fetchApi<{ status: string; phone: string | null }>('/api/qr/status'),
      ])
      setQr(qrRes.data?.qr ?? '')
      setConnection(statusRes.data?.status ?? 'disconnected')
      setPhone(statusRes.data?.phone ?? '')
      setLoading(false)
      setError(null)
    } catch (e) {
      setLoading(false)
      setError(e instanceof Error ? e.message : 'unknown error')
    }
  }, [])

  useEffect(() => {
    if (MOCK) return
    const id = setInterval(poll, pollInterval)
    const initId = setTimeout(poll)
    return () => {
      clearInterval(id)
      clearTimeout(initId)
    }
  }, [poll, pollInterval])

  return { qr, connection, phone, loading, error }
}
