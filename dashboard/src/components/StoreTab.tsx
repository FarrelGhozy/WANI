import { useRef } from 'react'
import type { ReactNode } from 'react'
import type { StoreProfile } from '../hooks/useSettings.ts'
import Card from './ui/Card.tsx'
import Button from './ui/Button.tsx'

interface StoreTabProps {
  store: StoreProfile
  onUpdate: (patch: Partial<StoreProfile>) => void
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-stone-500">{label}</label>
      {children}
    </div>
  )
}

export default function StoreTab({ store, onUpdate }: StoreTabProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onUpdate({ logoUrl: url })
  }

  const initial = store.businessName.charAt(0).toUpperCase()

  return (
    <Card accent="teal">
      <h2 className="mb-6 text-lg font-semibold text-stone-900">Store Profile</h2>

      {/* Photo */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row">
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
          <p className="text-sm font-medium text-stone-900">Store Photo</p>
          <p className="text-xs text-stone-500">Upload foto profil untuk toko Anda</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 text-xs font-medium text-teal-600 transition-colors hover:text-teal-700"
          >
            Change Photo
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Business Name">
          <input
            value={store.businessName}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <Field label="Phone">
          <input
            value={store.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <Field label="Address">
          <textarea
            value={store.address ?? ''}
            onChange={(e) => onUpdate({ address: e.target.value || null })}
            rows={3}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <Field label="Business Hours">
          <input
            value={store.businessHours ?? ''}
            onChange={(e) => onUpdate({ businessHours: e.target.value || null })}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <Field label="Payment Methods">
          <input
            value={store.paymentMethods ?? ''}
            onChange={(e) => onUpdate({ paymentMethods: e.target.value || null })}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <Field label="Shipping Info">
          <input
            value={store.shippingInfo ?? ''}
            onChange={(e) => onUpdate({ shippingInfo: e.target.value || null })}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Return Policy">
            <textarea
              value={store.returnPolicy ?? ''}
              onChange={(e) => onUpdate({ returnPolicy: e.target.value || null })}
              rows={3}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </Field>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-stone-900">Store Active</p>
          <p className="text-xs text-stone-500">Nonaktifkan untuk menyembunyikan toko dari pelanggan</p>
        </div>
        <button
          onClick={() => onUpdate({ isActive: !store.isActive })}
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
      <div className="mt-4 flex justify-end gap-3">
        <Button size="sm">Save Changes</Button>
      </div>
    </Card>
  )
}
