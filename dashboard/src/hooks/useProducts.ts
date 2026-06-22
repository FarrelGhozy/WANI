import { useState, useMemo, useCallback } from 'react'

export interface Category {
  id: string
  name: string
  description: string | null
}

export interface Product {
  id: string
  categoryId: string | null
  category: Category | null
  name: string
  description: string | null
  price: number
  stock: number
  isAvailable: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductFormData {
  name: string
  price: number
  stock: number
  categoryId: string | null
  description: string | null
  isAvailable: boolean
  imageUrl: string | null
}

const MOCK = true

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Makanan', description: 'Makanan berat & ringan' },
  { id: 'cat-2', name: 'Minuman', description: 'Minuman panas & dingin' },
  { id: 'cat-3', name: 'Snack', description: 'Camilan & kudapan' },
  { id: 'cat-4', name: 'Lainnya', description: 'Produk lain-lain' },
]

const mockProducts: Product[] = [
  { id: 'prod-1', categoryId: 'cat-1', category: mockCategories[0], name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan telur, ayam suwir, dan sayuran segar. Dilengkapi kerupuk dan acar.', price: 25000, stock: 15, isAvailable: true, imageUrl: null, createdAt: '2026-06-01T08:00:00Z', updatedAt: '2026-06-20T10:00:00Z' },
  { id: 'prod-2', categoryId: 'cat-1', category: mockCategories[0], name: 'Mie Ayam Bakso', description: 'Mie ayam pangsit dengan bakso sapi homemade.', price: 20000, stock: 20, isAvailable: true, imageUrl: null, createdAt: '2026-06-02T09:00:00Z', updatedAt: '2026-06-19T11:00:00Z' },
  { id: 'prod-3', categoryId: 'cat-1', category: mockCategories[0], name: 'Ayam Geprek', description: 'Ayam geprek sambal bawang dengan nasi putih dan lalapan.', price: 22000, stock: 10, isAvailable: true, imageUrl: null, createdAt: '2026-06-03T10:00:00Z', updatedAt: '2026-06-18T12:00:00Z' },
  { id: 'prod-4', categoryId: 'cat-2', category: mockCategories[1], name: 'Es Teh Manis', description: 'Teh manis segar dengan es batu.', price: 5000, stock: 50, isAvailable: true, imageUrl: null, createdAt: '2026-06-04T11:00:00Z', updatedAt: '2026-06-17T13:00:00Z' },
  { id: 'prod-5', categoryId: 'cat-2', category: mockCategories[1], name: 'Kopi Susu Gula Aren', description: 'Espresso dengan susu segar dan gula aren asli.', price: 18000, stock: 25, isAvailable: true, imageUrl: null, createdAt: '2026-06-05T12:00:00Z', updatedAt: '2026-06-16T14:00:00Z' },
  { id: 'prod-6', categoryId: 'cat-2', category: mockCategories[1], name: 'Jus Alpukat', description: 'Jus alpukat segar dengan susu coklat.', price: 15000, stock: 12, isAvailable: false, imageUrl: null, createdAt: '2026-06-06T13:00:00Z', updatedAt: '2026-06-15T15:00:00Z' },
  { id: 'prod-7', categoryId: 'cat-3', category: mockCategories[2], name: 'Pisang Goreng', description: 'Pisang goreng crispy dengan taburan meses dan keju.', price: 10000, stock: 30, isAvailable: true, imageUrl: null, createdAt: '2026-06-07T14:00:00Z', updatedAt: '2026-06-14T16:00:00Z' },
  { id: 'prod-8', categoryId: 'cat-3', category: mockCategories[2], name: 'Singkong Keju', description: 'Singkong goreng dengan balutan keju mozzarella.', price: 12000, stock: 18, isAvailable: true, imageUrl: null, createdAt: '2026-06-08T15:00:00Z', updatedAt: '2026-06-13T17:00:00Z' },
  { id: 'prod-9', categoryId: null, category: null, name: 'Kerupuk Aneka Rasa', description: 'Paket kerupuk aneka rasa (6 pcs).', price: 15000, stock: 40, isAvailable: true, imageUrl: null, createdAt: '2026-06-09T16:00:00Z', updatedAt: '2026-06-12T18:00:00Z' },
  { id: 'prod-10', categoryId: 'cat-3', category: mockCategories[2], name: 'Tahu Crispy', description: 'Tahu crispy balut tepung bumbu, cocok untuk cemilan.', price: 8000, stock: 0, isAvailable: false, imageUrl: null, createdAt: '2026-06-10T17:00:00Z', updatedAt: '2026-06-11T19:00:00Z' },
]

let nextId = 11

export function useProducts() {
  const allProducts = useMemo(() => MOCK ? mockProducts : [], [])
  const allCategories = useMemo(() => MOCK ? mockCategories : [], [])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortField, setSortField] = useState<'name' | 'price' | 'stock' | 'createdAt'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const filtered = useMemo(() => {
    const result = allProducts.filter((p) => {
      if (categoryFilter && p.categoryId !== categoryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q)) return false
      }
      return true
    })

    result.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })

    return result
  }, [search, categoryFilter, sortField, sortDir, allProducts])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const getProduct = useCallback((id: string): Product | undefined => {
    return allProducts.find((p) => p.id === id)
  }, [allProducts])

  const createProduct = useCallback((data: ProductFormData): Product => {
    const cat = allCategories.find((c) => c.id === data.categoryId) ?? null
    const product: Product = {
      id: `prod-${nextId++}`,
      ...data,
      category: cat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockProducts.unshift(product)
    return product
  }, [allCategories])

  const updateProduct = useCallback((id: string, data: Partial<ProductFormData>): Product | undefined => {
    const idx = mockProducts.findIndex((p) => p.id === id)
    if (idx === -1) return undefined
    const updated = {
      ...mockProducts[idx],
      ...data,
      category: data.categoryId
        ? allCategories.find((c) => c.id === data.categoryId) ?? null
        : null,
      updatedAt: new Date().toISOString(),
    }
    mockProducts[idx] = updated
    return updated
  }, [allCategories])

  const deleteProduct = useCallback((id: string): void => {
    const idx = mockProducts.findIndex((p) => p.id === id)
    if (idx !== -1) mockProducts.splice(idx, 1)
  }, [])

  return {
    products: filtered,
    categories: allCategories,
    loading: false,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    sortField, sortDir, toggleSort,
    getProduct, createProduct, updateProduct, deleteProduct,
  }
}
