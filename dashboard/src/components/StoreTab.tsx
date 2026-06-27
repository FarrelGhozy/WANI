import { useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { StoreProfile } from '@/hooks/useSettings.ts'
import { useProducts } from '@/hooks/useProducts.ts'
import { useToast } from '@/hooks/useToast.ts'
import Card from '@/components/ui/Card.tsx'
import Button from '@/components/ui/Button.tsx'
import Input from '@/components/ui/Input.tsx'
import Textarea from '@/components/ui/Textarea.tsx'
import CategoryModal from '@/components/CategoryModal.tsx'
import PaymentTab from '@/components/PaymentTab.tsx'

interface StoreTabProps {
  store: StoreProfile
  onUpdate: (patch: Partial<StoreProfile>) => void
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const

interface DayHours {
  open: boolean
  start: string
  end: string
}

type HoursState = Record<string, DayHours>

const DEFAULT_HOURS: HoursState = {
  Senin: { open: true, start: '08:00', end: '17:00' },
  Selasa: { open: true, start: '08:00', end: '17:00' },
  Rabu: { open: true, start: '08:00', end: '17:00' },
  Kamis: { open: true, start: '08:00', end: '17:00' },
  Jumat: { open: true, start: '08:00', end: '17:00' },
  Sabtu: { open: false, start: '', end: '' },
  Minggu: { open: false, start: '', end: '' },
}

function formatHoursState(hours: HoursState): string {
  const parts: string[] = []
  let i = 0
  const ds = DAYS as readonly string[]
  while (i < ds.length) {
    const day = ds[i]
    const h = hours[day]
    const endSame = (idx: number): boolean =>
      idx < ds.length &&
      hours[ds[idx]].open === h.open &&
      hours[ds[idx]].start === h.start &&
      hours[ds[idx]].end === h.end
    let j = i
    while (endSame(j)) j++
    if (j - 1 === i) {
      if (h.open) parts.push(`${ds[i]} ${h.start}–${h.end}`)
      else parts.push(`${ds[i]} libur`)
    } else {
      if (h.open) parts.push(`${ds[i]}–${ds[j - 1]} ${h.start}–${h.end}`)
      else parts.push(`${ds[i]}–${ds[j - 1]} libur`)
    }
    i = j
  }
  return parts.join(', ') + ' WIB'
}

function dayIndex(name: string): number {
  return DAYS.indexOf(name as typeof DAYS[number])
}

function isDay(name: string): name is typeof DAYS[number] {
  return DAYS.includes(name as typeof DAYS[number])
}

function parseToHoursState(str: string | null | undefined): HoursState {
  const result: HoursState = {} as HoursState
  for (const d of DAYS) result[d] = { open: false, start: '', end: '' }
  if (!str) return { ...DEFAULT_HOURS }
  const clean = str.replace(/\s*WIB\s*/g, '').trim()
  const parts = clean.split(',').map((s) => s.trim()).filter(Boolean)
  for (const part of parts) {
    const liburMatch = part.match(/^([A-Za-z]+(?:\s*–\s*[A-Za-z]+)?)\s+libur$/)
    if (liburMatch) {
      const name = liburMatch[1]
      if (name.includes('–')) {
        const [s, e] = name.split('–').map((n) => n.trim())
        const si = dayIndex(s)
        const ei = dayIndex(e)
        if (si >= 0 && ei >= 0) for (let k = si; k <= ei; k++) result[DAYS[k]] = { open: false, start: '', end: '' }
      } else if (isDay(name)) {
        result[name] = { open: false, start: '', end: '' }
      }
      continue
    }
    const timeMatch = part.match(/^([A-Za-z]+(?:\s*–\s*[A-Za-z]+)?)\s+(\d{2}:\d{2})–(\d{2}:\d{2})$/)
    if (timeMatch) {
      const name = timeMatch[1]
      const start = timeMatch[2]
      const end = timeMatch[3]
      if (name.includes('–')) {
        const [s, e] = name.split('–').map((n) => n.trim())
        const si = dayIndex(s)
        const ei = dayIndex(e)
        if (si >= 0 && ei >= 0) for (let k = si; k <= ei; k++) result[DAYS[k]] = { open: true, start, end }
      } else if (isDay(name)) {
        result[name] = { open: true, start, end }
      }
    }
  }
  return result
}

function cleanPhone(v: string): string {
  return v.replace(/^(\+62|62|0)/, '')
}

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = (value || '08:00').split(':')
  return (
    <span className="inline-flex items-center gap-0.5">
      <select
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m}`)}
        className="h-7 w-12 appearance-none rounded-md border border-stone-300 bg-white px-1 text-xs text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-14"
      >
        {HOURS.map((hr) => (
          <option key={hr} value={hr}>{hr}</option>
        ))}
      </select>
      <span className="text-xs text-stone-400">:</span>
      <select
        value={m}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className="h-7 w-12 appearance-none rounded-md border border-stone-300 bg-white px-1 text-xs text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-14"
      >
        {MINUTES.map((mi) => (
          <option key={mi} value={mi}>{mi}</option>
        ))}
      </select>
    </span>
  )
}

function BusinessHoursEditor({
  value,
  onChange,
  error,
}: {
  value: string | null
  onChange: (v: string) => void
  error?: string
}) {
  const hours = parseToHoursState(value)

  function setDay(day: string, patch: Partial<DayHours>) {
    const next = { ...hours, [day]: { ...hours[day], ...patch } }
    onChange(formatHoursState(next))
  }

  return (
    <div className="space-y-1">
      {DAYS.map((day) => {
        const h = hours[day]
        return (
          <div key={day} className="flex items-center gap-x-1.5 gap-y-1.5 flex-wrap">
            <span className="w-10 text-xs font-medium text-stone-700 sm:w-14">{day}</span>
            <button
              type="button"
              onClick={() => {
                if (h.open) {
                  setDay(day, { open: false })
                } else {
                  setDay(day, { open: true, start: '08:00', end: '17:00' })
                }
              }}
              className={`flex h-7 w-12 items-center justify-center rounded-md text-xs font-medium transition-colors sm:w-14 ${
                h.open
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              {h.open ? 'BUKA' : 'LIBUR'}
            </button>
            {h.open && (
              <span className="flex items-center gap-x-1.5 gap-y-1 flex-wrap sm:flex-nowrap">
                <TimeSelect value={h.start} onChange={(v) => setDay(day, { start: v })} />
                <span className="text-xs text-stone-400">&ndash;</span>
                <TimeSelect value={h.end} onChange={(v) => setDay(day, { end: v })} />
              </span>
            )}
          </div>
        )
      })}
      {error && <p className="pt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function validateHours(hours: HoursState): string | null {
  for (const day of DAYS) {
    const h = hours[day]
    if (h.open && h.start && h.end && h.start >= h.end) {
      return `${day}: jam tutup (${h.end}) harus setelah jam buka (${h.start})`
    }
  }
  return null
}

export default function StoreTab({ store, onUpdate }: StoreTabProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { categories, createCategory, updateCategory, deleteCategory } = useProducts()
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const [form, setForm] = useState(() => ({
    businessName: store.businessName,
    phone: cleanPhone(store.phone),
    address: store.address ?? '',
    businessHours: store.businessHours ?? null,
    shippingInfo: store.shippingInfo ?? null,
    returnPolicy: store.returnPolicy ?? null,
  }))

  const handleSave = useCallback(async () => {
    const errs: Record<string, string> = {}
    if (!form.businessName.trim()) errs.businessName = 'Nama bisnis wajib diisi'
    const hoursErr = validateHours(parseToHoursState(form.businessHours))
    if (hoursErr) errs.businessHours = hoursErr
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      await onUpdate({
        businessName: form.businessName,
        phone: form.phone,
        address: form.address || null,
        businessHours: form.businessHours || null,
        shippingInfo: form.shippingInfo || null,
        returnPolicy: form.returnPolicy || null,
      })
      toast('Pengaturan toko berhasil disimpan', 'success')
    } catch {
      toast('Gagal menyimpan pengaturan toko', 'error')
    } finally {
      setSaving(false)
    }
  }, [form, onUpdate, toast])

  const handleToggle = useCallback(async () => {
    try {
      await onUpdate({ isActive: !store.isActive })
      toast(store.isActive ? 'Toko berhasil dinonaktifkan' : 'Toko berhasil diaktifkan', 'success')
    } catch {
      toast('Gagal mengubah status toko', 'error')
    }
  }, [store.isActive, onUpdate, toast])

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('wani_auth_token')}` },
        body,
      })
      const json = await res.json()
      if (json.status === 'success') {
        await onUpdate({ logoUrl: json.data.url })
        toast('Foto toko berhasil diganti', 'success')
      } else {
        toast('Gagal mengupload foto', 'error')
      }
    } catch {
      toast('Gagal mengupload foto', 'error')
    }
  }

  const initial = store.businessName.charAt(0).toUpperCase()

  return (
    <>
      <Card accent="teal">
        <h2 className="mb-4 text-base font-semibold text-stone-900 md:mb-6 md:text-lg">Profil Toko</h2>

        {/* Photo */}
        <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row md:mb-6 md:gap-4">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-teal-50 ring-4 ring-teal-100">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.businessName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-teal-600">{initial}</span>
              )}
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-stone-900">Foto Toko</p>
            <p className="text-xs text-stone-500">Upload foto profil untuk toko Anda</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs font-medium text-teal-600 transition-colors hover:text-teal-700"
            >
              Ganti Foto
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:gap-5">
          <Input
            label="Nama Bisnis"
            value={form.businessName}
            onChange={(e) => { setForm((prev) => ({ ...prev, businessName: e.target.value })); setErrors((prev) => ({ ...prev, businessName: '' })) }}
            placeholder="Contoh: Warung Nasi Goreng"
            error={errors.businessName}
          />
          <Input
            label="TELEPON"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            prefix="+62"
            placeholder="81234567890"
            hint="Masukkan nomor setelah +62, cukup angka"
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Alamat"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Contoh: Jl. Merdeka No. 123, RT 01 RW 02, Kel. Sukamaju, Kec. Sukasari, Kota Bandung 40123"
              rows={3}
            />
          </div>
          <Field label="Jam Operasional" error={errors.businessHours}>
            <BusinessHoursEditor
              value={form.businessHours}
              onChange={(v) => { setForm((prev) => ({ ...prev, businessHours: v })); setErrors((prev) => ({ ...prev, businessHours: '' })) }}
            />
          </Field>
          <Textarea
            label="Info Pengiriman"
            value={form.shippingInfo ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, shippingInfo: e.target.value || null }))}
            placeholder="Contoh: Gratis ongkir untuk area Kec. Sukasari. Estimasi 1-2 hari kerja."
            rows={3}
          />
          <Textarea
            label="Kebijakan Retur"
            value={form.returnPolicy ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, returnPolicy: e.target.value || null }))}
            placeholder="Contoh: Barang dapat diretur maksimal 3 hari setelah diterima dengan kondisi masih segel. Biaya pengiriman retur ditanggung pembeli."
            rows={3}
          />
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2.5 md:mt-6 md:px-4 md:py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900">Toko Aktif</p>
            <p className="text-xs text-stone-500 truncate">Nonaktifkan untuk menyembunyikan toko dari pelanggan</p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              store.isActive ? 'bg-teal-600' : 'bg-stone-300'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                store.isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="mt-4 flex justify-end md:mt-6">
          <Button size="sm" loading={saving} onClick={handleSave}>Simpan Perubahan</Button>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card accent="teal">
        <h2 className="mb-4 text-base font-semibold text-stone-900 md:mb-5 md:text-lg">Metode Pembayaran</h2>
        <PaymentTab />
      </Card>

      {/* Categories */}
      <Card accent="teal">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-teal-600">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Kategori Produk</p>
              <p className="text-xs text-stone-500">{categories.length} kategori — atur pengelompokan produk Anda</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" className="w-full sm:w-auto" onClick={() => setCategoryModalOpen(true)}>
            Kelola Kategori
          </Button>
        </div>
      </Card>

      <Card accent="amber">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <circle cx="10" cy="10" r="7" />
                <path d="M3 10h14" />
                <path d="M10 3a7 7 0 010 14" />
                <path d="M7 4.6A12 12 0 007 15.4" />
                <path d="M13 4.6A12 12 0 0113 15.4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Kelola Website</p>
              <p className="text-xs text-stone-500">Atur tampilan website toko Anda — hero, warna, produk, dan template</p>
            </div>
          </div>
          <Link
            to="/website"
            className="w-full rounded-lg bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-amber-700 sm:w-auto sm:shrink-0"
          >
            Buka Website
          </Link>
        </div>
      </Card>

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </>
  )
}
