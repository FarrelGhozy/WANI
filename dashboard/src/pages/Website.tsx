import { useWebsite } from '@/hooks/useWebsite.ts'
import { useToast } from '@/hooks/useToast.ts'
import Card from '@/components/ui/Card.tsx'
import Button from '@/components/ui/Button.tsx'
import Badge from '@/components/ui/Badge.tsx'
import Input from '@/components/ui/Input.tsx'
import Textarea from '@/components/ui/Textarea.tsx'
import Spinner from '@/components/ui/Spinner.tsx'
import { formatDate } from '@/utils/format'

const PRESETS = [
  { name: 'Teal',   primary: '#059669', secondary: '#f59e0b' },
  { name: 'Rose',   primary: '#e11d48', secondary: '#f97316' },
  { name: 'Navy',   primary: '#1e40af', secondary: '#0d9488' },
  { name: 'Forest', primary: '#15803d', secondary: '#d97706' },
  { name: 'Sunset', primary: '#c2410c', secondary: '#d4a017' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-stone-500">{label}</label>
      {children}
    </div>
  )
}

export default function Website() {
  const { config, logs, generating, availableProducts, updateConfig, generate, downloadZip, publish, loading } = useWebsite()
  const { toast } = useToast()

  async function handleGenerate() {
    try {
      await generate()
      toast('Website berhasil dibuat', 'success')
    } catch {
      toast('Gagal membuat website', 'error')
    }
  }

  async function handlePublish() {
    try {
      await publish()
      toast('Website berhasil dipublikasikan', 'success')
    } catch {
      toast('Gagal mempublikasikan website', 'error')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Website</h1>
          <p className="mt-1 text-sm text-stone-500">Kelola website toko Anda — generate, preview, dan publish</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card accent="teal">
            <h2 className="mb-5 text-lg font-semibold text-stone-900">Konfigurasi Konten</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Judul Hero">
                <Input
                  value={config.heroHeadline}
                  onChange={(e) => updateConfig({ heroHeadline: e.target.value })}
                  placeholder="Contoh: Selamat Datang di Toko Kami"
                />
              </Field>
              <Field label="Subjudul Hero">
                <Input
                  value={config.heroSubheadline}
                  onChange={(e) => updateConfig({ heroSubheadline: e.target.value })}
                  placeholder="Contoh: Temukan produk terbaik untuk kebutuhan Anda"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Teks Tentang">
                  <Textarea
                    value={config.aboutText}
                    onChange={(e) => updateConfig({ aboutText: e.target.value })}
                    placeholder="Contoh: Toko kami berdiri sejak 2020, menyediakan berbagai produk berkualitas dengan harga terjangkau. Kami melayani pengiriman ke seluruh Indonesia."
                    rows={3}
                  />
                </Field>
              </div>
              <Field label="Warna Utama">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
                    aria-label="Pilih warna utama"
                  />
                  <span className="font-mono text-xs text-stone-500">{config.primaryColor}</span>
                </div>
              </Field>
              <Field label="Warna Sekunder">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
                    aria-label="Pilih warna sekunder"
                  />
                  <span className="font-mono text-xs text-stone-500">{config.secondaryColor}</span>
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Preset Warna (cepat)">
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => updateConfig({ primaryColor: p.primary, secondaryColor: p.secondary })}
                        className="group relative flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition-all hover:border-stone-300 hover:shadow-sm"
                        title={p.name}
                      >
                        <span className="h-4 w-4 rounded-full border border-stone-200" style={{ background: p.primary }} />
                        <span className="h-4 w-4 rounded-full border border-stone-200" style={{ background: p.secondary }} />
                        <span className="ml-1 text-stone-500">{p.name}</span>
                        {config.primaryColor === p.primary && config.secondaryColor === p.secondary && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] text-white">{'\u2713'}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="Nomor WhatsApp">
                <Input
                  value={config.phone}
                  onChange={(e) => updateConfig({ phone: e.target.value })}
                  placeholder="6281234567890"
                />
                <p className="mt-1 text-xs text-stone-400">Gunakan format internasional, contoh: 6281234567890 (tanpa +)</p>
              </Field>
              <Field label="Tema">
                <select
                  value={config.theme}
                  onChange={(e) => updateConfig({ theme: e.target.value })}
                  className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  aria-label="Pilih tema"
                >
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="vibrant">Vibrant</option>
                  <option value="elegant">Elegant</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label={'Pilih Produk (' + config.selectedProductIds.length + ' dipilih)'}>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-stone-200">
                    {availableProducts.map((p) => {
                      const checked = config.selectedProductIds.includes(p.id)
                      return (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-3 border-b border-stone-100 px-3 py-2.5 text-sm last:border-0 hover:bg-stone-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? config.selectedProductIds.filter((id) => id !== p.id)
                                : [...config.selectedProductIds, p.id]
                              updateConfig({ selectedProductIds: next })
                            }}
                            className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                          />
                          <div className="flex flex-1 items-center justify-between">
                            <span className="text-stone-700">{p.name}</span>
                            <span className="font-mono text-xs text-stone-400">Rp {p.price.toLocaleString('id-ID')}</span>
                          </div>
                        </label>
                      )
                    })}
                    {availableProducts.length === 0 && (
                      <p className="px-3 py-4 text-center text-xs text-stone-400">Tidak ada produk tersedia</p>
                    )}
                  </div>
                </Field>
              </div>
            </div>
          </Card>

          <Card accent="none" padding={false}>
            <div className="px-4 py-3 sm:px-6">
              <h2 className="text-lg font-semibold text-stone-900">Log Aktivitas</h2>
            </div>
            <div className="divide-y divide-stone-100 border-t border-stone-200">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <Badge variant={log.status === 'success' ? 'teal' : 'red'} dot>
                      {log.status === 'success' ? 'Berhasil' : 'Gagal'}
                    </Badge>
                    <div>
                      <p className="text-sm text-stone-700">{log.message}</p>
                      <p className="text-xs text-stone-400">{formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                  {log.status === 'success' && (
                    <span className="text-xs text-stone-400">{log.productCount} produk</span>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-stone-400">Belum ada aktivitas generate</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card accent="amber">
            <h2 className="mb-4 text-lg font-semibold text-stone-900">Aksi Cepat</h2>
            <div className="space-y-3">
              <Button size="md" className="w-full" loading={generating} onClick={handleGenerate}>
                Generate Sekarang
              </Button>
              <Button size="md" variant="secondary" className="w-full" onClick={() => window.open('/s/preview/default/', '_blank')}>
                Lihat Preview
              </Button>
              <Button size="md" variant="secondary" className="w-full" onClick={downloadZip}>
                Download ZIP
              </Button>
              <Button size="md" variant="secondary" className="w-full" onClick={handlePublish}>
                Publish
              </Button>
            </div>
          </Card>

          <Card accent="teal">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">Info</h2>
            <div className="space-y-2 text-xs text-stone-500">
              <p>Hasil generate akan muncul di folder <span className="font-mono text-stone-600">generated-sites/</span></p>
              <p>Gunakan Preview untuk melihat hasil sebelum publish.</p>
              <p>Download ZIP untuk menyimpan atau mengirim hasil generate.</p>
              <p>Template bisa ditambahkan di <span className="font-mono text-stone-600">src/templates/</span></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
