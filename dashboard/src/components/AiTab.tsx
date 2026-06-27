import type { ReactNode } from 'react'
import type { AiConfig } from '@/hooks/useSettings.ts'
import Card from '@/components/ui/Card.tsx'
import Button from '@/components/ui/Button.tsx'

interface AiTabProps {
  config: AiConfig
  onUpdate: (patch: Partial<AiConfig>) => void
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-stone-500">{label}</label>
      {children}
    </div>
  )
}

export default function AiTab({ config, onUpdate }: AiTabProps) {
  return (
    <Card accent="amber">
      <h2 className="mb-6 text-lg font-semibold text-stone-900">Konfigurasi AI Agent</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Model">
          <input
            type="text"
            value={config.model}
            onChange={(e) => onUpdate({ model: e.target.value })}
            placeholder="deepseek/deepseek-v4-flash:free"
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <p className="mt-1 text-xs text-stone-400">
            Cari model gratis di{' '}
            <a href="https://openrouter.ai/models?q=free" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">openrouter.ai/models</a>
            . Contoh: <code className="text-stone-500">deepseek/deepseek-v4-flash:free</code>,{' '}
            <code className="text-stone-500">google/gemini-2.0-flash-exp:free</code>
          </p>
          <p className="mt-0.5 text-xs text-stone-400">
            API Key diatur via <code className="text-stone-500">OPENROUTER_API_KEY</code> —{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">openrouter.ai/keys</a>
          </p>
        </Field>
        <Field label="Token Maksimal">
          <input
            type="number"
            value={config.maxTokens}
            onChange={(e) => onUpdate({ maxTokens: Number(e.target.value) })}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <Field label="Temperature">
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={(e) => onUpdate({ temperature: Number(e.target.value) })}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <Field label="Pesan Sapaan">
          <input
            value={config.greetingMessage ?? ''}
            onChange={(e) => onUpdate({ greetingMessage: e.target.value || null })}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="System Prompt">
            <textarea
              value={config.systemPrompt}
              onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Basis Pengetahuan">
            <textarea
              value={config.knowledgeBase ?? ''}
              onChange={(e) => onUpdate({ knowledgeBase: e.target.value || null })}
              rows={3}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </Field>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-stone-900">AI Agent Aktif</p>
          <p className="text-xs text-stone-500">Matikan untuk menjawab pelanggan secara manual</p>
        </div>
        <button
          onClick={() => onUpdate({ isActive: !config.isActive })}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            config.isActive ? 'bg-amber-500' : 'bg-stone-300'
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              config.isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <Button size="sm">Simpan Perubahan</Button>
      </div>
    </Card>
  )
}
