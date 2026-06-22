import { useState } from 'react'
import { useSettings } from '../hooks/useSettings.ts'
import StoreTab from '../components/StoreTab.tsx'
import AiTab from '../components/AiTab.tsx'
import WaSessionTab from '../components/WaSessionTab.tsx'
import Spinner from '../components/ui/Spinner.tsx'

const tabs = [
  { id: 'store', label: 'Store' },
  { id: 'ai', label: 'AI Agent' },
  { id: 'wa', label: 'WA Session' },
] as const

export default function Settings() {
  const [activeTab, setActiveTab] = useState<string>('store')
  const { store, aiConfig, waSession, updateStore, updateAiConfig, disconnectWa, loading } = useSettings()

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Settings</h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-stone-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Panels */}
      {activeTab === 'store' && <StoreTab store={store} onUpdate={updateStore} />}
      {activeTab === 'ai' && <AiTab config={aiConfig} onUpdate={updateAiConfig} />}
      {activeTab === 'wa' && <WaSessionTab session={waSession} onDisconnect={disconnectWa} />}
    </div>
  )
}
