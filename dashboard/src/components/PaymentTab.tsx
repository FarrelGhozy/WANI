import { useState, useRef, type ReactNode } from 'react'
import { usePaymentMethods } from '@/hooks/usePaymentMethods'
import type { StorePaymentMethod, PaymentMethodType, CreatePaymentMethodData } from '@/hooks/usePaymentMethods'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-stone-500">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
    />
  )
}

const TYPE_ICONS: Record<PaymentMethodType, string> = {
  QRIS: '▦',
  BANK_TRANSFER: '🏦',
  E_WALLET: '📱',
  COD: '💵',
}

const TYPE_LABELS: Record<PaymentMethodType, string> = {
  QRIS: 'QRIS',
  BANK_TRANSFER: 'Transfer Bank',
  E_WALLET: 'E-Wallet',
  COD: 'Bayar di Tempat (COD)',
}

const BANK_OPTIONS = [
  'BCA', 'Mandiri', 'BRI', 'BNI', 'BSI',
  'CIMB Niaga', 'Danamon', 'Permata', 'Maybank',
  'Panin', 'OCBC NISP', 'BTN', 'Bank Mega',
  'Bank Jago', 'SeaBank', 'Blu (BCA Digital)',
  'Lainnya',
]

const EWALLET_OPTIONS = ['GoPay', 'OVO', 'Dana', 'LinkAja', 'ShopeePay', 'Lainnya']

interface PaymentFormData {
  type: PaymentMethodType
  label: string
  qrImageUrl: string
  bankName: string
  accountNumber: string
  accountName: string
  providerName: string
  phoneNumber: string
  instructions: string
}

const emptyForm = (type: PaymentMethodType): PaymentFormData => ({
  type,
  label: '',
  qrImageUrl: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  providerName: '',
  phoneNumber: '',
  instructions: '',
})

export default function PaymentTab() {
  const { methods, loading, create, update, remove, toggleActive } = usePaymentMethods()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StorePaymentMethod | null>(null)
  const [form, setForm] = useState<PaymentFormData>(emptyForm('QRIS'))
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function openCreate(type: PaymentMethodType) {
    setEditing(null)
    const f = emptyForm(type)
    if (type === 'COD') f.instructions = 'Bayar tunai saat barang diterima'
    if (type === 'BANK_TRANSFER') f.bankName = 'BCA'
    if (type === 'E_WALLET') f.providerName = 'GoPay'
    setForm(f)
    setModalOpen(true)
  }

  function openEdit(m: StorePaymentMethod) {
    setEditing(m)
    setForm({
      type: m.type,
      label: m.label,
      qrImageUrl: m.qrImageUrl ?? '',
      bankName: m.bankName ?? '',
      accountNumber: m.accountNumber ?? '',
      accountName: m.accountName ?? '',
      providerName: m.providerName ?? '',
      phoneNumber: m.phoneNumber ?? '',
      instructions: m.instructions ?? '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
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
        setForm((prev) => ({ ...prev, qrImageUrl: json.data.url }))
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    const payload: Record<string, unknown> = {
      type: form.type,
      label: form.label,
      instructions: form.instructions || null,
    }

    switch (form.type) {
      case 'QRIS':
        payload.qrImageUrl = form.qrImageUrl
        break
      case 'BANK_TRANSFER':
        payload.bankName = form.bankName
        payload.accountNumber = form.accountNumber
        payload.accountName = form.accountName
        break
      case 'E_WALLET':
        payload.providerName = form.providerName
        payload.phoneNumber = form.phoneNumber
        payload.accountName = form.accountName || null
        break
      case 'COD':
        payload.instructions = form.instructions
        break
    }

    if (editing) {
      await update(editing.id, payload)
    } else {
      await create(payload as CreatePaymentMethodData)
    }
    closeModal()
  }

  async function handleDelete(method: StorePaymentMethod) {
    if (!confirm(`Hapus metode pembayaran "${method.label}"?`)) return
    await remove(method.id)
  }

  function updateLabel(m: StorePaymentMethod): string {
    if (m.label) return m.label
    switch (m.type) {
      case 'QRIS': return 'QRIS'
      case 'BANK_TRANSFER': return `${m.bankName ?? 'Bank'} a/n ${m.accountName ?? '-'}`
      case 'E_WALLET': return `${m.providerName ?? 'E-Wallet'} - ${m.phoneNumber ?? ''}`
      case 'COD': return 'Bayar di Tempat'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
  }

  const types: PaymentMethodType[] = ['QRIS', 'BANK_TRANSFER', 'E_WALLET', 'COD']

  return (
    <>
      <Card accent="teal">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Metode Pembayaran</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {methods.length === 0
                ? 'Belum ada metode pembayaran — tambahkan minimal satu metode agar pelanggan bisa membayar'
                : `${methods.filter((m) => m.isActive).length} aktif dari ${methods.length} metode`}
            </p>
          </div>
        </div>

        {methods.length === 0 && (
          <div className="mt-4 rounded-lg border-2 border-dashed border-stone-300 p-8 text-center">
            <p className="text-sm text-stone-500 mb-4">Tambahkan metode pembayaran pertama Anda</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                method.isActive
                  ? 'border-stone-200 bg-white'
                  : 'border-stone-100 bg-stone-50 opacity-60'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-base">
                {TYPE_ICONS[method.type] ?? '💳'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 truncate">{updateLabel(method)}</p>
                <p className="text-xs text-stone-500">{TYPE_LABELS[method.type]}</p>
                {method.type === 'BANK_TRANSFER' && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    {method.bankName} — {method.accountNumber}
                  </p>
                )}
                {method.qrImageUrl && (
                  <img
                    src={method.qrImageUrl}
                    alt="QRIS"
                    className="mt-2 h-20 w-20 rounded-lg border border-stone-200 object-cover"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(method)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    method.isActive ? 'bg-teal-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      method.isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  onClick={() => openEdit(method)}
                  className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(method)}
                  className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => openCreate(type)}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 py-4 text-sm text-stone-500 transition-all hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
            >
              <span className="text-xl">{TYPE_ICONS[type]}</span>
              <span className="font-medium">{TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Metode Pembayaran' : `Tambah ${TYPE_LABELS[form.type]}`}
        actions={
          <Button size="sm" onClick={handleSave}>
            {editing ? 'Simpan' : 'Tambah'}
          </Button>
        }
      >
        <div className="space-y-4">
          {!editing && (
            <Field label="Tipe Pembayaran">
              <Select
                value={form.type}
                onChange={(e) => setForm(emptyForm(e.target.value as PaymentMethodType))}
              >
                {types.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </Select>
            </Field>
          )}

          {form.type === 'QRIS' && (
            <Field label="QR Code">
              <div className="flex items-center gap-4">
                {form.qrImageUrl ? (
                  <div className="relative">
                    <img src={form.qrImageUrl} alt="QRIS" className="h-24 w-24 rounded-lg border border-stone-200 object-cover" />
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, qrImageUrl: '' }))}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-stone-400 transition-colors hover:border-teal-400 hover:text-teal-600"
                  >
                    {uploading ? <Spinner size={20} /> : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                    )}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <span className="text-xs text-stone-400">Upload gambar QRIS (PNG/JPEG, max 2MB)</span>
              </div>
            </Field>
          )}

          {form.type === 'BANK_TRANSFER' && (
            <>
              <Field label="Bank">
                <Select value={form.bankName} onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}>
                  {BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </Field>
              <Field label="Nomor Rekening">
                <Input value={form.accountNumber} onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))} placeholder="1234567890" />
              </Field>
              <Field label="Atas Nama">
                <Input value={form.accountName} onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))} placeholder="Toko Maju" />
              </Field>
            </>
          )}

          {form.type === 'E_WALLET' && (
            <>
              <Field label="Provider">
                <Select value={form.providerName} onChange={(e) => setForm((prev) => ({ ...prev, providerName: e.target.value }))}>
                  {EWALLET_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="Nomor HP">
                <Input value={form.phoneNumber} onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} placeholder="08123456789" />
              </Field>
              <Field label="Atas Nama (opsional)">
                <Input value={form.accountName} onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))} placeholder="Toko Maju" />
              </Field>
            </>
          )}

          {form.type === 'COD' && (
            <Field label="Instruksi Pembayaran">
              <input
                value={form.instructions}
                onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                placeholder="Bayar tunai saat barang diterima"
                className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </Field>
          )}

          <Field label="Label Tampilan">
            <input
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder={form.type === 'BANK_TRANSFER' ? `${form.bankName || 'Bank'} a/n ${form.accountName || '...'}` : TYPE_LABELS[form.type]}
              className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </Field>

          <Field label="Petunjuk Tambahan (opsional)">
            <textarea
              value={form.instructions}
              onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
              rows={2}
              placeholder={form.type === 'COD' ? 'Bayar tunai saat barang diterima' : 'Scan QRIS di atas menggunakan GoPay/OVO/Dana'}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
