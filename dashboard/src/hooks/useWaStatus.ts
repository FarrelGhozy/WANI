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
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingPhone, setPairingPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const poll = useCallback(async () => {
    try {
      const statusRes = await fetchApi<{ status: string; phone: string | null; connectedAt: string | null; pairingPhone: string | null; pairingCode: string | null }>('/qr/status')
      setConnection(statusRes.data?.status ?? 'disconnected')
      setPhone(statusRes.data?.phone ?? '')
      setConnectedAt(statusRes.data?.connectedAt ?? null)
      setPairingCode(statusRes.data?.pairingCode ?? null)
      setPairingPhone(statusRes.data?.pairingPhone ?? null)

      if (statusRes.data?.status !== 'connected') {
        const qrRes = await fetchApi<{ qr: string | null }>('/qr')
        setQr(qrRes.data?.qr ?? '')
      }

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

  return { qr, connection, phone, connectedAt, pairingCode, pairingPhone, loading, error }
}
