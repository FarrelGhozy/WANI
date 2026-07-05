import { useState, useRef } from 'react'
import { usePaymentMethods } from '@/hooks/usePaymentMethods.ts'
import type { StorePaymentMethod, PaymentMethodType, CreatePaymentMethodData } from '@/hooks/usePaymentMethods.ts'
import { useToast } from '@/hooks/useToast.ts'
import { uploadFile } from '@/lib/upload.ts'
import { mediaUrl } from '@/lib/media.ts'
import Button from '@/components/ui/Button.tsx'
import Modal from '@/components/ui/Modal.tsx'
import Spinner from '@/components/ui/Spinner.tsx'
import Input from '@/components/ui/Input.tsx'
import Select from '@/components/ui/Select.tsx'

const TYPE_CONFIG: Record<PaymentMethodType, { icon: string; label: string; color: string }> = {
  QRIS: { icon: '\u25A6', label: 'QRIS', color: 'bg-emerald-50 text-emerald-600' },
  BANK_TRANSFER: { icon: '\uD83C\uDFE6', label: 'Transfer Bank', color: 'bg-blue-50 text-blue-600' },
  E_WALLET: { icon: '\uD83D\uDCF1', label: 'E-Wallet', color: 'bg-violet-50 text-violet-600' },
  COD: { icon: '\uD83D\uDCB5', label: 'Bayar di Tempat (COD)', color: 'bg-amber-50 text-amber-600' },
}

const TYPE_ORDER: PaymentMethodType[] = ['QRIS', 'BANK_TRANSFER', 'E_WALLET', 'COD']

const BANK_OPTIONS = [
  { value: 'BCA', label: 'BCA' },
  { value: 'Mandiri', label: 'Mandiri' },
  { value: 'BRI', label: 'BRI' },
  { value: 'BNI', label: 'BNI' },
  { value: 'BSI', label: 'BSI' },
  { value: 'CIMB Niaga', label: 'CIMB Niaga' },
  { value: 'Danamon', label: 'Danamon' },
  { value: 'Permata', label: 'Permata' },
  { value: 'Maybank', label: 'Maybank' },
  { value: 'Panin', label: 'Panin' },
  { value: 'OCBC NISP', label: 'OCBC NISP' },
  { value: 'BTN', label: 'BTN' },
  { value: 'Bank Mega', label: 'Bank Mega' },
  { value: 'Bank Jago', label: 'Bank Jago' },
  { value: 'SeaBank', label: 'SeaBank' },
  { value: 'Blu (BCA Digital)', label: 'Blu (BCA Digital)' },
  { value: 'Lainnya', label: 'Lainnya' },
]

const EWALLET_OPTIONS = [
  { value: 'GoPay', label: 'GoPay' },
  { value: 'OVO', label: 'OVO' },
  { value: 'Dana', label: 'Dana' },
  { value: 'LinkAja', label: 'LinkAja' },
  { value: 'ShopeePay', label: 'ShopeePay' },
  { value: 'Lainnya', label: 'Lainnya' },
]

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
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StorePaymentMethod | null>(null)
  const [activeType, setActiveType] = useState<PaymentMethodType>('QRIS')
  const [form, setForm] = useState<PaymentFormData>(emptyForm('QRIS'))
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  function openCreate() {
    setEditing(null)
    setErrors({})
    const t = activeType
    const f = emptyForm(t)
    if (t === 'COD') f.instructions = 'Bayar tunai saat barang diterima'
    if (t === 'BANK_TRANSFER') f.bankName = 'BCA'
    if (t === 'E_WALLET') f.providerName = 'GoPay'
    setForm(f)
    setModalOpen(true)
  }

  function openEdit(m: StorePaymentMethod) {
    setEditing(m)
    setActiveType(m.type)
    setErrors({})
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
    setErrors({})
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await uploadFile(file, 'qris')
    setUploading(false)
    if (result.success && result.url) {
      setForm((prev) => ({ ...prev, qrImageUrl: result.url! }))
      setErrors((prev) => ({ ...prev, qrImageUrl: '' }))
      toast('QRIS berhasil diupload', 'success')
    } else {
      toast('Gagal mengupload QRIS', 'error')
    }
  }

  function validate(): boolean {
    const t = editing ? editing.type : activeType
    const errs: Record<string, string> = {}
    if (t === 'QRIS' && !form.qrImageUrl) errs.qrImageUrl = 'QR Code wajib diupload'
    if (t === 'BANK_TRANSFER') {
      if (!form.accountNumber) errs.accountNumber = 'Nomor rekening wajib diisi'
      if (!form.accountName) errs.accountName = 'Atas nama wajib diisi'
    }
    if (t === 'E_WALLET') {
      if (!form.phoneNumber) errs.phoneNumber = 'Nomor HP wajib diisi'
    }
    if (t === 'COD' && !form.instructions) errs.instructions = 'Instruksi pembayaran wajib diisi'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const t = editing ? editing.type : activeType
    const payload: Record<string, unknown> = {
      type: t,
      label: form.label,
      instructions: form.instructions || null,
    }

    switch (t) {
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

    try {
      if (editing) {
        await update(editing.id, payload)
        toast('Metode pembayaran berhasil diperbarui', 'success')
      } else {
        await create(payload as unknown as CreatePaymentMethodData)
        toast('Metode pembayaran berhasil ditambahkan', 'success')
      }
      closeModal()
    } catch {
      toast('Gagal menyimpan metode pembayaran', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(method: StorePaymentMethod) {
    if (!confirm(`Hapus metode pembayaran "${method.label}"?`)) return
    try {
      await remove(method.id)
      toast('Metode pembayaran berhasil dihapus', 'success')
    } catch {
      toast('Gagal menghapus metode pembayaran', 'error')
    }
  }

  async function handleToggle(method: StorePaymentMethod) {
    try {
      await toggleActive(method)
      toast(method.isActive ? 'Metode pembayaran dinonaktifkan' : 'Metode pembayaran diaktifkan', 'success')
    } catch {
      toast('Gagal mengubah status metode pembayaran', 'error')
    }
  }

  function methodLabel(m: StorePaymentMethod): string {
    if (m.label) return m.label
    switch (m.type) {
      case 'QRIS': return 'QRIS'
      case 'BANK_TRANSFER': return `${m.bankName ?? 'Bank'} a/n ${m.accountName ?? '-'}`
      case 'E_WALLET': return `${m.providerName ?? 'E-Wallet'} - ${m.phoneNumber ?? ''}`
      case 'COD': return 'Bayar di Tempat'
    }
  }

  function methodDetail(m: StorePaymentMethod): string {
    switch (m.type) {
      case 'BANK_TRANSFER': return `${m.bankName} — ${m.accountNumber}`
      case 'E_WALLET': return m.phoneNumber ?? ''
      case 'COD': return m.instructions ?? ''
      default: return ''
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
  }

  return (
    <>
      {/* Type tabs + Add button */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex w-max gap-1 rounded-lg bg-stone-100 p-1">
            {TYPE_ORDER.map((t) => {
              const cfg = TYPE_CONFIG[t]
              const count = methods.filter((m) => m.type === t).length
              return (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    activeType === t
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                  <span className="hidden sm:inline ml-0.5 rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] tabular-nums text-stone-500">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
        <Button size="sm" onClick={openCreate}>Tambah {TYPE_CONFIG[activeType].label}</Button>
      </div>

      {/* Table */}
      {methods.length === 0 ? (
        <div className="mt-4 rounded-lg border-2 border-dashed border-stone-300 p-6 text-center md:p-8">
          <p className="text-sm text-stone-500 mb-1">Belum ada metode pembayaran</p>
          <p className="text-xs text-stone-400">Tambahkan minimal satu metode agar pelanggan bisa membayar</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[36%]" />
              <col className="w-[30%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs font-medium uppercase tracking-wider text-stone-400">
                <th className="py-2 pr-3 md:py-3 md:pr-4">Tipe</th>
                <th className="py-2 pr-3 md:py-3 md:pr-4">Detail</th>
                <th className="py-2 pr-3 text-center md:py-3 md:pr-4">Status</th>
                <th className="py-2 text-right md:py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {methods.map((method) => (
                <tr
                  key={method.id}
                  className={`transition-colors hover:bg-stone-50/50 ${method.isActive ? '' : 'opacity-50'}`}
                >
                  <td className="py-2 pr-3 md:py-3 md:pr-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs md:h-8 md:w-8 md:text-sm ${TYPE_CONFIG[method.type].color}`}>
                        {TYPE_CONFIG[method.type].icon}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-stone-900 md:text-sm">
                          {methodLabel(method)}
                        </p>
                        <p className="truncate text-[10px] text-stone-400 md:text-xs">{TYPE_CONFIG[method.type].label}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-3 md:py-3 md:pr-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      {method.type === 'QRIS' && method.qrImageUrl ? (
                        <img src={mediaUrl(method.qrImageUrl)} alt="QRIS" className="h-8 w-8 rounded border border-stone-200 object-cover md:h-10 md:w-10" />
                      ) : null}
                      <span className="text-[10px] text-stone-600 md:text-xs">{methodDetail(method)}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-center md:py-3 md:pr-4">
                    <button
                      onClick={() => handleToggle(method)}
                      className={`relative inline-block h-5 w-9 rounded-full transition-colors ${
                        method.isActive ? 'bg-teal-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          method.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-2 text-right md:py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(method)}
                        className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(method)}
                        className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal with type tabs */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Metode Pembayaran' : `Tambah ${TYPE_CONFIG[activeType].label}`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={handleSave}>
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Type tabs (disabled when editing) */}
          {!editing && (
            <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
              {TYPE_ORDER.map((t) => {
                const cfg = TYPE_CONFIG[t]
                return (
                  <button
                    key={t}
                    onClick={() => { setActiveType(t); setForm(emptyForm(t)); setErrors({}) }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                      activeType === t
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* QRIS fields */}
          {(editing ? editing.type : activeType) === 'QRIS' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-stone-500">QR Code</label>
              <div className="flex items-center gap-4">
                {form.qrImageUrl ? (
                  <div className="relative">
                    <img src={mediaUrl(form.qrImageUrl)} alt="QRIS" className="h-24 w-24 rounded-lg border border-stone-200 object-cover" />
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
              {errors.qrImageUrl && <p className="text-xs text-red-500">{errors.qrImageUrl}</p>}
            </div>
          )}

          {/* Bank Transfer fields */}
          {(editing ? editing.type : activeType) === 'BANK_TRANSFER' && (
            <>
              <Select
                label="Bank"
                options={BANK_OPTIONS}
                value={form.bankName}
                onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
              />
              <Input
                label="Nomor Rekening"
                value={form.accountNumber}
                onChange={(e) => { setForm((prev) => ({ ...prev, accountNumber: e.target.value })); setErrors((prev) => ({ ...prev, accountNumber: '' })) }}
                placeholder="1234567890"
                error={errors.accountNumber}
              />
              <Input
                label="Atas Nama"
                value={form.accountName}
                onChange={(e) => { setForm((prev) => ({ ...prev, accountName: e.target.value })); setErrors((prev) => ({ ...prev, accountName: '' })) }}
                placeholder="Toko Maju"
                error={errors.accountName}
              />
            </>
          )}

          {/* E-Wallet fields */}
          {(editing ? editing.type : activeType) === 'E_WALLET' && (
            <>
              <Select
                label="Provider"
                options={EWALLET_OPTIONS}
                value={form.providerName}
                onChange={(e) => setForm((prev) => ({ ...prev, providerName: e.target.value }))}
              />
              <Input
                label="Nomor HP"
                value={form.phoneNumber}
                onChange={(e) => { setForm((prev) => ({ ...prev, phoneNumber: e.target.value })); setErrors((prev) => ({ ...prev, phoneNumber: '' })) }}
                placeholder="08123456789"
                error={errors.phoneNumber}
              />
              <Input
                label="Atas Nama (opsional)"
                value={form.accountName}
                onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
                placeholder="Toko Maju"
              />
            </>
          )}

          {/* COD fields */}
          {(editing ? editing.type : activeType) === 'COD' && (
            <Input
              label="Instruksi Pembayaran"
              value={form.instructions}
              onChange={(e) => { setForm((prev) => ({ ...prev, instructions: e.target.value })); setErrors((prev) => ({ ...prev, instructions: '' })) }}
              placeholder="Bayar tunai saat barang diterima"
              error={errors.instructions}
            />
          )}

          <Input
            label="Label Tampilan"
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
            placeholder={'Label khusus (opsional)'}
          />

          {(editing ? editing.type : activeType) !== 'COD' && (
            <Input
              label="Petunjuk Tambahan (opsional)"
              value={form.instructions}
              onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
              placeholder="Scan QRIS di atas menggunakan GoPay/OVO/Dana"
            />
          )}
        </div>
      </Modal>
    </>
  )
}
