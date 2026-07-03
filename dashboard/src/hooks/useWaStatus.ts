import { useState, useEffect, useCallback } from 'react'
import { fetchApi } from '@/lib/api.ts'
import { getErrorMessage } from '@/hooks/useToast.ts'
import type { WaStatus } from '@/types.ts'

export type { WaStatus }

export function useWaStatus(pollInterval = 5000): WaStatus {
  const [qr, setQr] = useState('')
  const [connection, setConnection] = useState('disconnected')
  const [phone, setPhone] = useState('')
  const [connectedAt, setConnectedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const poll = useCallback(async () => {
    try {
      const [qrRes, statusRes] = await Promise.all([
        fetchApi<{ qr: string | null }>('/api/qr'),
        fetchApi<{ status: string; phone: string | null; connectedAt: string | null }>('/api/qr/status'),
      ])
      setQr(qrRes.data?.qr ?? '')
      setConnection(statusRes.data?.status ?? 'disconnected')
      setPhone(statusRes.data?.phone ?? '')
      setConnectedAt(statusRes.data?.connectedAt ?? null)
      setLoading(false)
      setError(null)
    } catch (e) {
      setLoading(false)
      setError(getErrorMessage(e, 'Gagal memeriksa status WA'))
    }
  }, [])

  useEffect(() => {
    const id = setInterval(poll, pollInterval)
    const initId = setTimeout(poll)
    return () => {
      clearInterval(id)
      clearTimeout(initId)
    }
  }, [poll, pollInterval])

  return { qr, connection, phone, connectedAt, loading, error }
}
