import { useState } from 'react'
import { useWebsite } from '@/hooks/useWebsite.ts'
import { useToast } from '@/hooks/useToast.ts'
import Card from '@/components/ui/Card.tsx'
import Button from '@/components/ui/Button.tsx'
import Modal from '@/components/ui/Modal.tsx'
import Badge from '@/components/ui/Badge.tsx'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton.tsx'
import ImageUpload from '@/components/ui/ImageUpload.tsx'
import { formatDate } from '@/utils/format'

export default function Website() {
  const { config, logs, latestSlug, generating, availableProducts, updateConfig, generate, downloadZip, deleteGeneration, loading, error, reload } = useWebsite()
  const { toast, apiError } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleGenerate() {
    try {
      const slug = await generate()
      if (slug) {
        toast('Website berhasil dibuat', 'success')
      } else {
        apiError(new Error('Gagal membuat website'), 'Gagal membuat website')
      }
    } catch (e) {
      apiError(e, 'Gagal membuat website')
    }
  }

  function handlePreview(slug?: string) {
    const s = slug || latestSlug
    if (s) window.open(`/s/${s}/`, '_blank')
    else toast('Belum ada website yang di-generate', 'error')
  }

  async function handleDownload(slug?: string) {
    try {
      await downloadZip(slug)
    } catch (e) {
      apiError(e, 'Gagal mendownload ZIP')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGeneration(id)
      toast('Riwayat berhasil dihapus', 'success')
    } catch (e) {
      apiError(e, 'Gagal menghapus riwayat')
    }
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Skeleton variant="text" className="h-7 w-40" />
          <Skeleton variant="text" className="mt-2 h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SkeletonCard height="h-96" />
            <SkeletonCard height="h-56" />
          </div>
          <div className="space-y-4">
            <SkeletonCard height="h-40" />
            <SkeletonCard height="h-32" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Website</h1>
          <p className="mt-1 text-sm text-stone-500">Kelola website toko Anda — generate, preview, dan download</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={reload}
              className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card accent="teal">
            <h2 className="mb-5 text-lg font-semibold text-stone-900">Konfigurasi Konten</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Gambar Hero"
                  value={config.heroImageUrl ?? null}
                  onChange={(url) => updateConfig({ heroImageUrl: url })}
                  prefix="hero"
                />
              </div>
              <Field label="Judul Hero">
                <input
                  value={config.heroHeadline}
                  onChange={(e) => updateConfig({ heroHeadline: e.target.value })}
                  placeholder="Contoh: Selamat Datang di Toko Kami"
                  className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </Field>
              <Field label="Subjudul Hero">
                <input
                  value={config.heroSubheadline}
                  onChange={(e) => updateConfig({ heroSubheadline: e.target.value })}
                  placeholder="Contoh: Temukan produk terbaik untuk kebutuhan Anda"
                  className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </Field>
              <Field label="Teks Tombol CTA">
                <input
                  value={config.ctaText ?? 'Lihat Produk'}
                  onChange={(e) => updateConfig({ ctaText: e.target.value })}
                  placeholder="Lihat Produk"
                  className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Teks Tentang">
                  <textarea
                    value={config.aboutText}
                    onChange={(e) => updateConfig({ aboutText: e.target.value })}
                    placeholder="Contoh: Toko kami berdiri sejak 2020, menyediakan berbagai produk berkualitas dengan harga terjangkau."
                    rows={3}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Gambar Tentang"
                  value={config.aboutImageUrl ?? null}
                  onChange={(url) => updateConfig({ aboutImageUrl: url })}
                  prefix="about"
                />
              </div>
              <Field label="Warna Utama">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
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
                  />
                  <span className="font-mono text-xs text-stone-500">{config.secondaryColor}</span>
                </div>
              </Field>
              <div className="sm:col-span-2">
                <div className="rounded-xl border border-stone-200 overflow-hidden">
                  <div className="flex h-3" style={{ background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }} />
                  <div className="grid grid-cols-2 divide-x divide-stone-200 bg-white">
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full border border-stone-200" style={{ background: config.primaryColor }} />
                        <span className="text-xs font-medium text-stone-600">Primary</span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-stone-400">{config.primaryColor}</p>
                    </div>
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full border border-stone-200" style={{ background: config.secondaryColor }} />
                        <span className="text-xs font-medium text-stone-600">Secondary</span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-stone-400">{config.secondaryColor}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-stone-400">Preview skema warna website Anda</p>
              </div>
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Logo Toko (untuk Website)"
                  value={config.logoUrl ?? null}
                  onChange={(url) => updateConfig({ logoUrl: url })}
                  prefix="logo"
                />
              </div>
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Favicon (Icon Tab Browser)"
                  value={config.faviconUrl ?? null}
                  onChange={(url) => updateConfig({ faviconUrl: url })}
                  prefix="favicon"
                />
                <p className="mt-1 text-[10px] text-stone-400">Kalau tidak diisi, logo toko akan jadi favicon. Ukuran disarankan persegi (1:1).</p>
              </div>

              <Field label="Nomor WhatsApp">
                <input
                  value={config.phone}
                  onChange={(e) => updateConfig({ phone: e.target.value })}
                  placeholder="6281234567890"
                  className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <p className="text-xs text-stone-400">Gunakan format internasional, contoh: 6281234567890 (tanpa +)</p>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Pilih Template">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {TEMPLATES.map((t) => {
                      const active = config.template === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            const d = TEMPLATE_DEFAULTS[t.id]
                            updateConfig({ template: t.id, ...(d ? { primaryColor: d.primary, secondaryColor: d.secondary } : {}) })
                          }}
                          className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all ${
                            active
                              ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                              : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                            {t.id === 'default' ? (
                              <div className="flex h-full items-center justify-center text-stone-300">
                                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                              </div>
                            ) : (
                              <img
                                src={`/templates/${t.id}.png`}
                                alt={t.label}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2.5">
                            <div className="flex gap-1">
                              <span className="h-3 w-3 rounded-full border border-stone-200" style={{ background: t.primary }} />
                              <span className="h-3 w-3 rounded-full border border-stone-200" style={{ background: t.secondary }} />
                            </div>
                            <span className={`text-xs font-medium ${active ? 'text-teal-700' : 'text-stone-600'}`}>
                              {t.label}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={`Pilih Produk (${config.selectedProductIds.length} dipilih)`}>
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

          <Card accent="teal">
            <h2 className="mb-5 text-lg font-semibold text-stone-900">Media Sosial</h2>
            <p className="mb-4 text-xs text-stone-500">Centang platform yang ingin ditampilkan, lalu masukkan URL profil toko Anda.</p>
            <div className="space-y-3">
              {SOCIAL_PLATFORMS.map((sp) => {
                const checked = sp.key in config.socialMedia
                const url = checked ? config.socialMedia[sp.key] || '' : ''
                return (
                  <div key={sp.key} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = { ...config.socialMedia }
                        if (checked) {
                          delete next[sp.key]
                        } else {
                          next[sp.key] = ''
                        }
                        updateConfig({ socialMedia: next })
                      }}
                      className="mt-2.5 h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1 space-y-1">
                      <label className="text-sm font-medium text-stone-700">{sp.label}</label>
                      <input
                        value={url}
                        onChange={(e) => {
                          const next = { ...config.socialMedia, [sp.key]: e.target.value }
                          updateConfig({ socialMedia: next })
                        }}
                        disabled={!checked}
                        placeholder={checked ? 'https://...' : ''}
                        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${checked ? 'border-stone-300' : 'border-stone-200 bg-stone-50 text-stone-400'}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card accent="none" padding={false}>
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <h2 className="text-lg font-semibold text-stone-900">Log Aktivitas</h2>
              {logs.length > 0 && (
                <span className="text-xs text-stone-400">{logs.length} generate</span>
              )}
            </div>
            <div className="divide-y divide-stone-100 border-t border-stone-200">
              {logs.map((log) => (
                <div key={log.id} className="px-4 py-3 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Badge variant={log.status === 'success' ? 'green' : 'red'} dot>
                        {log.status === 'success' ? 'Berhasil' : 'Gagal'}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm text-stone-700 truncate">{log.message}</p>
                        <p className="text-xs text-stone-400">{formatDate(log.createdAt)}</p>
                      </div>
                    </div>
                    {log.status === 'success' && (
                      <span className="text-xs text-stone-400 shrink-0">{log.productCount} produk</span>
                    )}
                  </div>
                  {log.status === 'success' && (
                    <div className="mt-2 flex items-center gap-2 pl-9">
                      <button
                        type="button"
                        onClick={() => handlePreview(log.slug)}
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        Lihat Preview
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleDownload(log.slug)}
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        Download ZIP
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={() => setDeleting(log.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
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
              <Button
                size="md"
                className="w-full"
                loading={generating}
                onClick={handleGenerate}
              >
                Generate Sekarang
              </Button>
              <Button
                size="md"
                variant="secondary"
                className="w-full"
                disabled={!latestSlug}
                onClick={() => handlePreview()}
              >
                Lihat Preview (Terbaru)
              </Button>
              <Button
                size="md"
                variant="secondary"
                className="w-full"
                disabled={!latestSlug}
                onClick={() => handleDownload()}
              >
                Download ZIP (Terbaru)
              </Button>
            </div>
          </Card>

          <Card accent="teal">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">Info</h2>
            <div className="space-y-2 text-xs text-stone-500">
              <p>Setiap generate menyimpan hasil terpisah — riwayat lengkap dengan preview & download.</p>
              <p>Klik Lihat Preview di log untuk melihat hasil generate tertentu.</p>
              <p>Template bisa ditambahkan di <span className="font-mono text-stone-600">src/templates/</span></p>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Hapus Riwayat">
        <p className="text-sm text-stone-700">Hapus riwayat generate ini?</p>
        <p className="mt-1 text-xs text-stone-400">File website terkait juga akan dihapus.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Button variant="danger" size="sm" onClick={() => handleDelete(deleting!)}>
            Hapus
          </Button>
        </div>
      </Modal>
    </div>
  )
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'tokopedia', label: 'Tokopedia' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'linkedin', label: 'LinkedIn' },
]

const TEMPLATES = [
  { id: 'default',   label: 'Default (Astro)', desc: 'Fleksibel, tema classy & modern', primary: '#059669', secondary: '#f59e0b' },
  { id: 'modern',    label: 'Modern',          desc: 'Profesional, bersih, corporate', primary: '#004ac6', secondary: '#505f76' },
  { id: 'vibrant',   label: 'Vibrant',         desc: 'Bold, playful, warna-warni', primary: '#f97316', secondary: '#8b5cf6' },
  { id: 'cyberpunk', label: 'Cyberpunk',       desc: 'Dark, neon, futuristic', primary: '#06b6d4', secondary: '#d946ef' },
  { id: 'minimalist',label: 'Minimalist',      desc: 'Elegan, whitespace, tipografi', primary: '#1c1917', secondary: '#78716c' },
  { id: 'classic',   label: 'Classic',         desc: 'Luxury, renaissance, editorial', primary: '#785600', secondary: '#5f5e5e' },
]

const TEMPLATE_DEFAULTS: Record<string, { primary: string; secondary: string }> = {}
for (const t of TEMPLATES) {
  TEMPLATE_DEFAULTS[t.id] = { primary: t.primary, secondary: t.secondary }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-stone-500">{label}</label>
      {children}
    </div>
  )
}
