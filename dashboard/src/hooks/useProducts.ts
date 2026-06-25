import { useState, useMemo, useCallback, useEffect } from 'react'
import { fetchApi } from '@/lib/api'

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

export function useProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortField, setSortField] = useState<'name' | 'category' | 'price' | 'stock' | 'isAvailable'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prodRes, catRes] = await Promise.all([
        fetchApi<{ items: Product[]; total: number }>('/api/products?limit=100'),
        fetchApi<{ items: Category[] }>('/api/products/categories'),
      ])
      setAllProducts(prodRes.data?.items ?? [])
      setAllCategories(catRes.data?.items ?? [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

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
      if (sortField === 'category') {
        const aName = a.category?.name ?? ''
        const bName = b.category?.name ?? ''
        return sortDir === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName)
      }
      if (sortField === 'isAvailable') {
        return sortDir === 'asc'
          ? Number(b.isAvailable) - Number(a.isAvailable)
          : Number(a.isAvailable) - Number(b.isAvailable)
      }
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

  const createProduct = useCallback(async (data: ProductFormData): Promise<Product | undefined> => {
    try {
      const res = await fetchApi<Product>('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.data) {
        setAllProducts((prev) => [res.data!, ...prev])
        return res.data
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const updateProduct = useCallback(async (id: string, data: Partial<ProductFormData>): Promise<Product | undefined> => {
    try {
      const res = await fetchApi<Product>(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.data) {
        setAllProducts((prev) => prev.map((p) => p.id === id ? res.data! : p))
        return res.data
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      await fetchApi(`/api/products/${id}`, { method: 'DELETE' })
      setAllProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const createCategory = useCallback(async (data: { name: string; description?: string | null }): Promise<Category | undefined> => {
    try {
      const res = await fetchApi<Category>('/api/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.data) {
        setAllCategories((prev) => [...prev, res.data!])
        return res.data
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const updateCategory = useCallback(async (id: string, data: { name?: string; description?: string | null }): Promise<Category | undefined> => {
    try {
      const res = await fetchApi<Category>(`/api/products/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.data) {
        setAllCategories((prev) => prev.map((c) => c.id === id ? res.data! : c))
        return res.data
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      await fetchApi(`/api/products/categories/${id}`, { method: 'DELETE' })
      setAllCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  return {
    products: filtered,
    categories: allCategories,
    loading,
    error,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    sortField, sortDir, toggleSort,
    getProduct, createProduct, updateProduct, deleteProduct,
    createCategory, updateCategory, deleteCategory,
    reload: load,
  }
}
