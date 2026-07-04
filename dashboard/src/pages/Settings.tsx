import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useStoreContext } from '@/contexts/StoreContext.tsx'
import { useWaStatusContext } from '@/contexts/WaStatusContext.tsx'
import { useToast } from '@/hooks/useToast.ts'
import { fetchApi } from '@/lib/api.ts'
import StoreTab from '@/components/StoreTab.tsx'
import AiTab from '@/components/AiTab.tsx'
import WaSessionTab from '@/components/WaSessionTab.tsx'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton.tsx'

const tabs = [
  { id: 'store', label: 'Toko' },
  { id: 'ai', label: 'AI Agent' },
  { id: 'wa', label: 'WA Session' },
] as const

export default function Settings() {
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl && tabs.some(t => t.id === tabFromUrl) ? tabFromUrl : 'store')

  useEffect(() => {
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  function handleTabChange(tab: string) {
    setActiveTab(tab)
  }
  const { store, aiConfig, error, updateAiConfig, loading, reload } = useStoreContext()
  const { qr: liveQr, connection: liveConn, phone: livePhone, connectedAt: liveConnectedAt } = useWaStatusContext()
  const { toast, apiError } = useToast()

  const [override, setOverride] = useState<{ connection: string; qr: string; phone: string } | null>(null)

  const qr = override?.qr ?? liveQr
  const connection = override?.connection ?? liveConn
  const phone = override?.phone ?? livePhone
  const connectedAt = liveConnectedAt

  const handleDisconnect = useCallback(() => {
    setOverride({ connection: 'disconnected', qr: '', phone: '' })
  }, [])

  const handleConnect = useCallback(() => {
    setOverride(null)
  }, [])

  const [resetting, setResetting] = useState(false)

  const handleAiUpdate = useCallback(async (patch: Partial<import('@/hooks/useSettings.ts').AiConfig>) => {
    try {
      await updateAiConfig(patch)
      toast('Konfigurasi AI berhasil disimpan', 'success')
    } catch (e) {
      apiError(e, 'Gagal menyimpan konfigurasi AI')
    }
  }, [updateAiConfig, toast])

  const handleReset = useCallback(async () => {
    if (resetting) return
    setResetting(true)
    try {
      await fetchApi('/qr/reset', { method: 'POST' })
      setOverride(null)
      toast('Koneksi WhatsApp direset. Scan QR baru untuk menghubungkan.', 'info')
    } catch (e) {
      apiError(e, 'Gagal mereset koneksi')
    } finally {
      setResetting(false)
    }
  }, [resetting, toast])

  if (loading) {
    return (
      <div className="space-y-5 md:space-y-6">
        <Skeleton variant="text" className="h-7 w-40" />
        <div className="flex gap-1 border-b border-stone-200 pb-0">
          <Skeleton variant="rectangular" className="h-10 w-16" />
          <Skeleton variant="rectangular" className="h-10 w-20" />
          <Skeleton variant="rectangular" className="h-10 w-24" />
        </div>
        <SkeletonCard height="h-80" />
      </div>
    )
  }

  if (!store || !aiConfig) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-sm text-stone-500">
          {error || 'Gagal memuat pengaturan.'}
        </p>
        <button
          onClick={reload}
          className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          Coba lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-stone-900 md:text-2xl">Pengaturan</h1>

      <div className="flex overflow-x-auto border-b border-stone-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3 py-2.5 text-sm font-medium transition-all sm:px-5 sm:py-3 ${
              activeTab === tab.id
                ? 'border-b-2 border-teal-600 text-teal-700'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'store' && <StoreTab />}
      {activeTab === 'ai' && <AiTab key={aiConfig.id} config={aiConfig} onUpdate={handleAiUpdate} />}
      {activeTab === 'wa' && (
        <WaSessionTab
          qr={qr}
          connection={connection}
          phone={phone}
          connectedAt={connectedAt}
          onDisconnect={handleDisconnect}
          onConnect={handleConnect}
          onReset={handleReset}
          resetting={resetting}
        />
      )}
    </div>
  )
}
