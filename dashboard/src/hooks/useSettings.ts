import { useState, useCallback, useEffect } from 'react'
import { fetchApi } from '@/lib/api'
import type { StoreProfile, AiConfig } from '@/types.ts'

export type { StoreProfile, AiConfig }

export function useSettings() {
  const [store, setStore] = useState<StoreProfile | null>(null)
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfigs = useCallback(async () => {
    const [storeRes, aiRes] = await Promise.all([
      fetchApi<StoreProfile>('/api/store'),
      fetchApi<AiConfig>('/api/ai-config'),
    ])
    return { store: storeRes.data, aiConfig: aiRes.data }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchConfigs()
        if (!cancelled) {
          setStore(data.store)
          setAiConfig(data.aiConfig)
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [fetchConfigs])

  const updateStore = useCallback(async (patch: Partial<StoreProfile>) => {
    try {
      const res = await fetchApi<StoreProfile>('/api/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.data) setStore(res.data)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const updateAiConfig = useCallback(async (patch: Partial<AiConfig>) => {
    try {
      const res = await fetchApi<AiConfig>('/api/ai-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.data) setAiConfig(res.data)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  return { store, aiConfig, loading, error, updateStore, updateAiConfig, reload: useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchConfigs()
      setStore(data.store)
      setAiConfig(data.aiConfig)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [fetchConfigs]) }
}
