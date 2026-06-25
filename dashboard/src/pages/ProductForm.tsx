import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useProducts, type ProductFormData } from '@/hooks/useProducts.ts'
import Button from '@/components/ui/Button.tsx'
import Input from '@/components/ui/Input.tsx'
import Select from '@/components/ui/Select.tsx'
import Card from '@/components/ui/Card.tsx'

function formatPriceInput(value: string) {
  const num = value.replace(/[^\d]/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('id-ID')
}

function parsePrice(value: string) {
  return Number(value.replace(/[^\d]/g, ''))
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProduct, categories, createProduct, updateProduct, createCategory } = useProducts()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<ProductFormData>({
    name: '',
    price: 0,
    stock: 0,
    categoryId: '',
    description: '',
    isAvailable: true,
    imageUrl: '',
  })

  const [priceDisplay, setPriceDisplay] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    set('imageUrl', url)
  }

  useEffect(() => {
    if (id) {
      const product = getProduct(id)
      if (product) {
        const timer = setTimeout(() => {
          setForm({
            name: product.name,
            price: product.price,
            stock: product.stock,
            categoryId: product.categoryId ?? '',
            description: product.description ?? '',
            isAvailable: product.isAvailable,
            imageUrl: product.imageUrl ?? '',
          })
          setPriceDisplay(formatPriceInput(String(product.price)))
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [id, getProduct])

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.name.trim()) errs.name = 'Nama produk harus diisi'
    if (form.price <= 0) errs.price = 'Harga harus lebih dari 0'
    if (form.stock < 0) errs.stock = 'Stok tidak boleh negatif'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    setCreatingCategory(true)
    const cat = await createCategory({ name: newCategoryName.trim(), description: newCategoryDesc.trim() || null })
    if (cat) {
      set('categoryId', cat.id)
    }
    setCreatingCategory(false)
    setShowNewCategory(false)
    setNewCategoryName('')
    setNewCategoryDesc('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data: ProductFormData = {
      ...form,
      categoryId: form.categoryId || null,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
    }
    if (isEdit && id) {
      updateProduct(id, data)
    } else {
      createProduct(data)
    }
    setTimeout(() => {
      setSaving(false)
      navigate('/products')
    }, 300)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/products')}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Kembali ke Produk
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {isEdit ? 'Edit Produk' : 'Tambah Produk'}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {isEdit ? 'Update detail produk Anda' : 'Tambahkan produk baru ke daftar'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image */}
        <Card>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">Gambar</h2>
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Pratinjau produk" className="h-full w-full object-cover" />
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-300">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <Input
                label="URL Gambar"
                placeholder="https://example.com/image.jpg"
                hint="Tempel link gambar atau upload file"
                value={form.imageUrl ?? ''}
                onChange={(e) => set('imageUrl', e.target.value)}
              />
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-400">atau</span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-800"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload Gambar
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Basic Info */}
        <Card accent="teal">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">Info Dasar</h2>
          <div className="space-y-4">
            <Input
              label="Nama Produk"
              placeholder="Nasi Goreng Spesial"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
            />
            <Select
              label="Kategori"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Tanpa Kategori"
              value={form.categoryId ?? ''}
              onChange={(e) => set('categoryId', e.target.value)}
            />
            {showNewCategory ? (
              <div className="mt-2 space-y-2 rounded-lg border border-teal-200 bg-teal-50 p-3">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nama kategori baru"
                  className="h-9 w-full rounded-md border border-stone-300 bg-white px-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <input
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Deskripsi (opsional)"
                  className="h-9 w-full rounded-md border border-stone-300 bg-white px-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateCategory} loading={creatingCategory} disabled={!newCategoryName.trim()}>
                    Simpan
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setShowNewCategory(false); setNewCategoryName(''); setNewCategoryDesc('') }}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-teal-600 transition-colors hover:text-teal-700"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Tambah Kategori Baru
              </button>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-stone-500">Deskripsi</label>
              <textarea
                placeholder="Deskripsi produk..."
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>
        </Card>

        {/* Pricing & Stock */}
        <Card accent="amber">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">Harga & Stok</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Harga"
              prefix="Rp"
              placeholder="25.000"
              value={priceDisplay}
              onChange={(e) => {
                const raw = e.target.value
                const num = parsePrice(raw)
                set('price', num)
                setPriceDisplay(formatPriceInput(raw))
              }}
              error={errors.price}
            />
            <Input
              label="Stok"
              type="number"
              min={0}
              placeholder="0"
              value={form.stock}
              onChange={(e) => set('stock', Math.max(0, Number(e.target.value)))}
              error={errors.stock}
            />
          </div>
          <div className="mt-4">
            <label className="text-xs font-medium uppercase tracking-wider text-stone-500">Status</label>
            <div className="mt-1.5 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  name="availability"
                  checked={form.isAvailable}
                  onChange={() => set('isAvailable', true)}
                  className="h-4 w-4 accent-teal-600"
                />
                Aktif
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  name="availability"
                  checked={!form.isAvailable}
                  onChange={() => set('isAvailable', false)}
                  className="h-4 w-4 accent-red-500"
                />
                Nonaktif
              </label>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
            Batal
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Update Produk' : 'Simpan Produk'}
          </Button>
        </div>
      </form>
    </div>
  )
}
