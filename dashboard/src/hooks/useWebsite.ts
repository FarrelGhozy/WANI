import { useState, useCallback, useMemo, useEffect } from 'react'
import { fetchApi } from '@/lib/api.ts'
import { useProducts } from '@/hooks/useProducts.ts'
import type { WebsiteConfig, GenerateLog } from '@/types.ts'

export type { WebsiteConfig, GenerateLog }

const defaultConfig: WebsiteConfig = {
  heroHeadline: 'Selamat Datang di Toko Kami',
  heroSubheadline: 'Temukan produk terbaik kami',
  aboutText: '',
  primaryColor: '#059669',
  secondaryColor: '#f59e0b',
  phone: '',
  selectedProductIds: [],
  template: 'default',
}

export function useWebsite() {
  const { products } = useProducts()
  const [config, setConfig] = useState<WebsiteConfig>(defaultConfig)
  const [logs, setLogs] = useState<GenerateLog[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchApi<Record<string, unknown>>('/api/website')
        if (!cancelled && res.data) {
          setConfig((prev) => ({ ...prev, ...res.data as Partial<WebsiteConfig> }))
        }
      } catch {
        // API not available — use defaults
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const updateConfig = useCallback(async (patch: Partial<WebsiteConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
    try {
      await fetchApi('/api/website', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
    } catch {
      // Silent save failure
    }
  }, [])

  const availableProducts = useMemo(() => {
    return products.filter((p) => p.isAvailable)
  }, [products])

  const generate = useCallback(async () => {
    setGenerating(true)
    try {
      const res = await fetchApi<Record<string, unknown>>('/api/website/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: config.template }),
      })
      setLogs((prev) => [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        status: res.status === 'success' ? 'success' : 'failed',
        productCount: config.selectedProductIds.length,
        message: res.status === 'success' ? 'Website berhasil di-generate' : (res.message ?? 'Gagal generate'),
      }, ...prev])
    } catch (e) {
      setLogs((prev) => [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        status: 'failed',
        productCount: 0,
        message: (e as Error).message,
      }, ...prev])
    } finally {
      setGenerating(false)
    }
  }, [config.template, config.selectedProductIds.length])

  const downloadZip = useCallback(async () => {
    const token = localStorage.getItem('wani_auth_token')
    if (token) {
      window.open(`/api/website/download?token=${token}`, '_blank')
      return
    }
    window.open('/api/website/download', '_blank')
  }, [])

  const publish = useCallback(async () => {
    await fetchApi('/api/website/publish', { method: 'POST' })
  }, [])

  return {
    config,
    logs,
    generating,
    availableProducts,
    updateConfig,
    generate,
    downloadZip,
    publish,
    loading,
  }
}
