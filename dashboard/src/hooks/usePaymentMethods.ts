import { useState, useCallback, useEffect } from 'react'
import { fetchApi } from '@/lib/api'
import type { StorePaymentMethod, PaymentMethodType } from '@/types'

export type { StorePaymentMethod, PaymentMethodType }

export interface CreatePaymentMethodData {
  type: PaymentMethodType
  label: string
  qrImageUrl?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  providerName?: string
  phoneNumber?: string
  instructions?: string
}

export interface UpdatePaymentMethodData {
  label?: string
  isActive?: boolean
  sortOrder?: number
  qrImageUrl?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  providerName?: string
  phoneNumber?: string
  instructions?: string
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<StorePaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchApi<StorePaymentMethod[]>('/api/store/payment-methods')
        if (!cancelled) setMethods(res.data ?? [])
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchApi<StorePaymentMethod[]>('/api/store/payment-methods')
      setMethods(res.data ?? [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: CreatePaymentMethodData) => {
    const res = await fetchApi<StorePaymentMethod>('/api/store/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.data) setMethods((prev) => [...prev, res.data!])
    return res.data
  }, [])

  const update = useCallback(async (id: string, data: UpdatePaymentMethodData) => {
    const res = await fetchApi<StorePaymentMethod>(`/api/store/payment-methods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.data) {
      setMethods((prev) => prev.map((m) => (m.id === id ? res.data! : m)))
    }
    return res.data
  }, [])

  const remove = useCallback(async (id: string) => {
    await fetchApi(`/api/store/payment-methods/${id}`, { method: 'DELETE' })
    setMethods((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const toggleActive = useCallback(async (method: StorePaymentMethod) => {
    return update(method.id, { isActive: !method.isActive })
  }, [update])

  return { methods, loading, error, reload, create, update, remove, toggleActive }
}
