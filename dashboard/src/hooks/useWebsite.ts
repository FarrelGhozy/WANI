import { useState, useCallback, useMemo, useEffect } from 'react'
import { fetchApi } from '@/lib/api.ts'
import { useProducts } from '@/hooks/useProducts.ts'
import type { WebsiteConfig, GenerationLog } from '@/types.ts'

export type { WebsiteConfig, GenerationLog }

const defaultConfig: WebsiteConfig = {
  heroHeadline: 'Selamat Datang di Toko Kami',
  heroSubheadline: 'Temukan produk terbaik kami',
  aboutText: '',
  primaryColor: '#059669',
  secondaryColor: '#f59e0b',
  phone: '',
  selectedProductIds: [],
  template: 'default',
  theme: 'classic',
  socialMedia: {},
  heroImageUrl: null,
  aboutImageUrl: null,
  logoUrl: null,
  faviconUrl: null,
  ctaText: 'Lihat Produk',
}

function getToken(): string | null {
  return localStorage.getItem('wani_auth_token')
}

export function useWebsite() {
  const { products } = useProducts()
  const [config, setConfig] = useState<WebsiteConfig>(defaultConfig)
  const [logs, setLogs] = useState<GenerationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cfgRes, genRes] = await Promise.all([
          fetchApi<Record<string, unknown>>('/api/website'),
          fetchApi<GenerationLog[]>('/api/website/generations'),
        ])
        if (!cancelled) {
          if (cfgRes.data) {
            setConfig((prev) => ({ ...prev, ...cfgRes.data as Partial<WebsiteConfig> }))
          }
          if (genRes.data) {
            setLogs(genRes.data)
          }
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

  const latestSlug = useMemo(() => {
    const success = logs.filter((l) => l.status === 'success')
    return success.length > 0 ? success[0].slug : null
  }, [logs])

  const generate = useCallback(async (): Promise<string | null> => {
    setGenerating(true)
    try {
      const res = await fetchApi<{ slug: string }>('/api/website/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: config.template }),
      })
      if (res.data?.slug) {
        const newLog: GenerationLog = {
          id: `temp-${Date.now()}`,
          slug: res.data.slug,
          status: 'success',
          productCount: config.selectedProductIds.length,
          message: `Website berhasil di-generate`,
          createdAt: new Date().toISOString(),
        }
        setLogs((prev) => [newLog, ...prev])
        return res.data.slug
      }
      return null
    } catch {
      return null
    } finally {
      setGenerating(false)
    }
  }, [config.template, config.selectedProductIds.length])

  const refreshLogs = useCallback(async () => {
    try {
      const res = await fetchApi<GenerationLog[]>('/api/website/generations')
      if (res.data) setLogs(res.data)
    } catch {
      // ignore
    }
  }, [])

  const downloadZip = useCallback(async (slug?: string) => {
    const token = getToken()
    const params = slug ? `?slug=${slug}` : ''
    const res = await fetch(`/api/website/download${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `website-${slug || 'latest'}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const deleteGeneration = useCallback(async (id: string) => {
    const token = getToken()
    const res = await fetch(`/api/website/generations/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error('Delete failed')
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const publish = useCallback(async () => {
    await fetchApi('/api/website/publish', { method: 'POST' })
  }, [])

  return {
    config,
    logs,
    latestSlug,
    generating,
    availableProducts,
    updateConfig,
    generate,
    refreshLogs,
    downloadZip,
    deleteGeneration,
    publish,
    loading,
  }
}
