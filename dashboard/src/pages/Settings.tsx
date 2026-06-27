import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { useSettings } from '@/hooks/useSettings.ts'
import { useWaStatus } from '@/hooks/useWaStatus.ts'
import { fetchApi } from '@/lib/api.ts'
import StoreTab from '@/components/StoreTab.tsx'
import AiTab from '@/components/AiTab.tsx'
import WaSessionTab from '@/components/WaSessionTab.tsx'
import PaymentTab from '@/components/PaymentTab.tsx'
import Spinner from '@/components/ui/Spinner.tsx'

const tabs = [
  { id: 'store', label: 'Toko' },
  { id: 'ai', label: 'AI Agent' },
  { id: 'wa', label: 'WA Session' },
  { id: 'payment', label: 'Pembayaran' },
] as const

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'store'

  function handleTabChange(tab: string) {
    setSearchParams(tab === 'store' ? {} : { tab }, { replace: true })
  }
  const { store, aiConfig, error, updateStore, updateAiConfig, loading, reload } = useSettings()
  const { qr: liveQr, connection: liveConn, phone: livePhone } = useWaStatus()

  const [override, setOverride] = useState<{ connection: string; qr: string; phone: string } | null>(null)

  const qr = override?.qr ?? liveQr
  const connection = override?.connection ?? liveConn
  const phone = override?.phone ?? livePhone

  const handleDisconnect = useCallback(() => {
    setOverride({ connection: 'disconnected', qr: '', phone: '' })
  }, [])

  const handleConnect = useCallback(() => {
    setOverride(null)
  }, [])

  const [resetting, setResetting] = useState(false)

  const handleReset = useCallback(async () => {
    if (resetting) return
    setResetting(true)
    try {
      await fetchApi('/api/qr/reset', { method: 'POST' })
      setOverride(null)
    } catch {
      // error ignored — next poll will show current state
    } finally {
      setResetting(false)
    }
  }, [resetting])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Pengaturan</h1>

      <div className="flex overflow-x-auto border-b border-stone-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'border-b-2 border-teal-600 text-teal-700'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'store' && <StoreTab store={store} onUpdate={updateStore} />}
      {activeTab === 'ai' && <AiTab config={aiConfig} onUpdate={updateAiConfig} />}
      {activeTab === 'wa' && (
        <WaSessionTab
          qr={qr}
          connection={connection}
          phone={phone}
          onDisconnect={handleDisconnect}
          onConnect={handleConnect}
          onReset={handleReset}
          resetting={resetting}
        />
      )}
      {activeTab === 'payment' && <PaymentTab />}
    </div>
  )
}
