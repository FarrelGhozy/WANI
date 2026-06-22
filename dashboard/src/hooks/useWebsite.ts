import { useState, useCallback, useMemo } from 'react'
import { useProducts } from './useProducts.ts'

export interface WebsiteConfig {
  heroHeadline: string
  heroSubheadline: string
  aboutText: string
  primaryColor: string
  secondaryColor: string
  phone: string
  selectedProductIds: string[]
  template: string
}

export interface GenerateLog {
  id: string
  timestamp: string
  status: 'success' | 'failed'
  productCount: number
  message: string
}

const MOCK = true

const mockConfig: WebsiteConfig = {
  heroHeadline: 'Selamat Datang di WANI Kitchen',
  heroSubheadline: 'Temukan produk terbaik kami',
  aboutText: 'WANI Kitchen adalah UMKM yang menyediakan makanan dan minuman berkualitas dengan cita rasa tradisional Indonesia.',
  primaryColor: '#059669',
  secondaryColor: '#f59e0b',
  phone: '+6281234567890',
  selectedProductIds: ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5'],
  template: 'default',
}

const mockLogs: GenerateLog[] = [
  { id: 'log-1', timestamp: '2026-06-22 14:30', status: 'success', productCount: 5, message: 'Website berhasil di-generate' },
  { id: 'log-2', timestamp: '2026-06-21 10:15', status: 'success', productCount: 5, message: 'Preview diperbarui' },
  { id: 'log-3', timestamp: '2026-06-20 09:00', status: 'failed', productCount: 0, message: 'Gagal: template tidak ditemukan' },
]

export function useWebsite() {
  const { products } = useProducts()
  const [config, setConfig] = useState<WebsiteConfig>(MOCK ? { ...mockConfig } : mockConfig)
  const [logs, setLogs] = useState<GenerateLog[]>(MOCK ? [...mockLogs] : [])
  const [generating, setGenerating] = useState(false)

  const updateConfig = useCallback((patch: Partial<WebsiteConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const availableProducts = useMemo(() => {
    return MOCK ? products.filter((p) => p.isAvailable) : []
  }, [products])

  const generate = useCallback(async () => {
    if (!MOCK) {
      setGenerating(true)
      try {
        const res = await fetch('/api/website/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })
        const data = await res.json()
        if (data.status === 'success') {
          setLogs((prev) => [{
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleString('id-ID'),
            status: 'success',
            productCount: config.selectedProductIds.length,
            message: 'Website berhasil di-generate',
          }, ...prev])
        }
      } finally {
        setGenerating(false)
      }
      return
    }

    setGenerating(true)
    await new Promise((r) => setTimeout(r, 1500))
    setLogs((prev) => [{
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      status: 'success',
      productCount: config.selectedProductIds.length,
      message: 'Website berhasil di-generate',
    }, ...prev])
    setGenerating(false)
  }, [config])

  const downloadZip = useCallback(async () => {
    if (!MOCK) {
      window.open('/api/website/download', '_blank')
      return
    }
    alert('ZIP download akan tersedia setelah API terintegrasi')
  }, [])

  const publish = useCallback(async () => {
    if (!MOCK) {
      await fetch('/api/website/publish', { method: 'POST' })
      return
    }
    alert('Fitur publish akan tersedia setelah API terintegrasi')
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
    loading: false,
  }
}
