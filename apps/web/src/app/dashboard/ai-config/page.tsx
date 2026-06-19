'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Bot,
  Power,
  Save,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';

interface AIAgent {
  id: string;
  isActive: boolean;
  systemPrompt: string;
  model: string;
  greetingMessage: string | null;
  knowledgeBase: string | null;
  maxTokens: number;
  temperature: number;
}

const defaultPrompt = `Kamu adalah AI Customer Service untuk {nama_toko}.
Gunakan bahasa Indonesia yang sopan dan ramah.

=== INFO TOKO ===
{toko_info}

=== ATURAN ===
1. Jika customer ingin pesan, keluarkan format ORDER
2. Jika customer tanya harga/produk, jawab dari daftar produk
3. Jika customer marah/komplain, minta maaf dan escalation
4. JANGAN pernah mengarang produk yang tidak ada`;

export default function AIConfigPage() {
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmToggle, setConfirmToggle] = useState(false);

  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [model, setModel] = useState('opencode/deepseek-v4-flash-free');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);

  const fetchAgent = useCallback(async () => {
    const res = await api.get<{ data: AIAgent }>('/ai-agent/me');
    if (res.success && res.data.data) {
      const a = res.data.data;
      setAgent(a);
      setSystemPrompt(a.systemPrompt);
      setGreetingMessage(a.greetingMessage || '');
      setKnowledgeBase(a.knowledgeBase || '');
      setModel(a.model);
      setMaxTokens(Number(a.maxTokens));
      setTemperature(Number(a.temperature));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAgent(); }, [fetchAgent]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    const res = await api.put('/ai-agent/me', {
      systemPrompt,
      greetingMessage: greetingMessage || undefined,
      knowledgeBase: knowledgeBase || undefined,
      model,
      maxTokens,
      temperature,
    });
    setSaving(false);
    if (res.success) {
      setSuccessMsg('Pengaturan AI berhasil disimpan');
      fetchAgent();
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setError(res.error || 'Gagal menyimpan');
    }
  }

  async function handleToggle() {
    const res = await api.post('/ai-agent/me/toggle', {});
    if (res.success) {
      setConfirmToggle(false);
      fetchAgent();
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-surface-900">AI Config</h1>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Customer Service
              </CardTitle>
            </CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-surface-900">
                  Status: {agent?.isActive ? 'Aktif' : 'Nonaktif'}
                </p>
                <p className="text-sm text-surface-400">Model: {model}</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={agent?.isActive || false}
                  onChange={() => setConfirmToggle(true)}
                />
                <Button
                  variant={agent?.isActive ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => setConfirmToggle(true)}
                >
                  <Power className="h-4 w-4" />
                  {agent?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model</CardTitle>
            </CardHeader>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
            >
              <option value="google/gemma-4-26b-a4b-it:free">Gemma 4 26B A4B (Free)</option>
              <option value="opencode/deepseek-v4-flash-free">DeepSeek V4 Flash (Free)</option>
              <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
            </select>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
            </CardHeader>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm font-mono outline-none focus:border-primary-500"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-surface-400">{systemPrompt.length} / 4096 karakter</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSystemPrompt(defaultPrompt)}
              >
                <RotateCcw className="h-3 w-3" />
                Reset Default
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
            </CardHeader>
            <textarea
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
              placeholder="Informasi toko yang harus diketahui AI..."
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pesan Sambutan</CardTitle>
            </CardHeader>
            <input
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
              placeholder="Halo! Selamat datang di toko kami..."
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Lanjutan</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  min={256}
                  max={8192}
                  step={256}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Temperature: {temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-surface-400">
                  <span>Presisi (0)</span>
                  <span>Kreatif (2)</span>
                </div>
              </div>
            </div>
          </Card>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto">
            <Save className="h-4 w-4" />
            Simpan Pengaturan
          </Button>
        </div>
      )}

      <Dialog
        open={confirmToggle}
        onClose={() => setConfirmToggle(false)}
        title={agent?.isActive ? 'Nonaktifkan AI' : 'Aktifkan AI'}
      >
        <p className="text-sm text-surface-600 mb-6">
          {agent?.isActive
            ? 'Yakin nonaktifkan AI? Pelanggan tidak akan mendapat balasan otomatis.'
            : 'Aktifkan AI untuk membalas pesan pelanggan secara otomatis?'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmToggle(false)}>Batal</Button>
          <Button onClick={handleToggle}>{agent?.isActive ? 'Nonaktifkan' : 'Aktifkan'}</Button>
        </div>
      </Dialog>
    </div>
  );
}
