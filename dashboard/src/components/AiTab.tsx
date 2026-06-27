import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AiConfig } from '@/hooks/useSettings.ts'
import Card from '@/components/ui/Card.tsx'
import Button from '@/components/ui/Button.tsx'

interface AiTabProps {
  config: AiConfig
  onUpdate: (patch: Partial<AiConfig>) => Promise<void>
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
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [model, setModel] = useState(config.model)
  const [maxTokens, setMaxTokens] = useState(config.maxTokens)
  const [temperature, setTemperature] = useState(config.temperature)
  const [greetingMessage, setGreetingMessage] = useState(config.greetingMessage ?? '')
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt)
  const [knowledgeBase, setKnowledgeBase] = useState(config.knowledgeBase ?? '')

  useEffect(() => {
    setModel(config.model)
    setMaxTokens(config.maxTokens)
    setTemperature(config.temperature)
    setGreetingMessage(config.greetingMessage ?? '')
    setSystemPrompt(config.systemPrompt)
    setKnowledgeBase(config.knowledgeBase ?? '')
  }, [config])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setDirty(false)
    try {
      await onUpdate({
        model,
        maxTokens,
        temperature,
        greetingMessage: greetingMessage || null,
        systemPrompt,
        knowledgeBase: knowledgeBase || null,
      })
    } catch {
      setDirty(true)
    } finally {
      setSaving(false)
    }
  }, [model, maxTokens, temperature, greetingMessage, systemPrompt, knowledgeBase, onUpdate])

  const handleToggle = useCallback(async () => {
    setSaving(true)
    try {
      await onUpdate({ isActive: !config.isActive })
    } finally {
      setSaving(false)
    }
  }, [config.isActive, onUpdate])

  return (
    <Card accent="amber">
      <h2 className="mb-6 text-lg font-semibold text-stone-900">Konfigurasi AI Agent</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Model">
          <input
            type="text"
            value={model}
            onChange={(e) => { setModel(e.target.value); setDirty(true) }}
            placeholder="google/gemma-4-31b-it:free"
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <p className="mt-1 text-xs text-stone-400">
            Cari model gratis di{' '}
            <a href="https://openrouter.ai/models?q=free" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">openrouter.ai/models</a>
            . Contoh: <code className="text-stone-500">google/gemma-4-31b-it:free</code>,{' '}
            <code className="text-stone-500">qwen/qwen3-next-80b-a3b-instruct:free</code>
          </p>
          <p className="mt-0.5 text-xs text-stone-400">
            API Key diatur via <code className="text-stone-500">OPENROUTER_API_KEY</code> —{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">openrouter.ai/keys</a>
          </p>
        </Field>
        <Field label="Token Maksimal">
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => { setMaxTokens(Number(e.target.value)); setDirty(true) }}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <Field label="Temperature">
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => { setTemperature(Number(e.target.value)); setDirty(true) }}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <Field label="Pesan Sapaan">
          <textarea
            value={greetingMessage}
            onChange={(e) => { setGreetingMessage(e.target.value); setDirty(true) }}
            placeholder="Selamat datang di toko kami! Ada yang bisa dibantu?"
            rows={3}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <p className="text-xs text-stone-400">Pesan otomatis ketika pelanggan menyapa. Biarkan kosong untuk menggunakan pesan bawaan.</p>
        </Field>
        <div className="sm:col-span-2">
          <Field label="System Prompt">
            <textarea
              value={systemPrompt}
              onChange={(e) => { setSystemPrompt(e.target.value); setDirty(true) }}
              placeholder="Kosongkan untuk menggunakan prompt bawaan (nama toko, katalog, aturan keamanan, dan format output JSON akan otomatis disisipkan)"
              rows={8}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <p className="text-xs text-stone-400">Instruksi tambahan untuk AI. Jika dikosongkan, AI akan menggunakan prompt default yang mencakup info toko, katalog produk, dan aturan keamanan.</p>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Basis Pengetahuan">
            <textarea
              value={knowledgeBase}
              onChange={(e) => { setKnowledgeBase(e.target.value); setDirty(true) }}
              placeholder="Contoh: Jam operasional custom, informasi promo, FAQ, kebijakan khusus..."
              rows={5}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <p className="text-xs text-stone-400">Informasi tambahan yang akan disisipkan ke prompt AI. Bisa diisi jam operasional, daftar promo, FAQ, atau kebijakan khusus toko.</p>
          </Field>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-stone-900">AI Agent Aktif</p>
          <p className="text-xs text-stone-500">Matikan untuk menjawab pelanggan secara manual</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            config.isActive ? 'bg-amber-500' : 'bg-stone-300'
          } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              config.isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <Button size="sm" loading={saving} disabled={!dirty} onClick={handleSave}>Simpan Perubahan</Button>
      </div>
    </Card>
  )
}
