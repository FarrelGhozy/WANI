import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { mockFetchApi } = vi.hoisted(() => ({
  mockFetchApi: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  fetchApi: mockFetchApi,
}))

vi.mock('@/hooks/useToast', async () => {
  const actual = await vi.importActual('@/hooks/useToast')
  return { ...actual }
})

import { useProducts } from '../useProducts'
import type { Product, Category } from '@/types'

const mockProduct: Product = {
  id: 'p1',
  name: 'Nasi Goreng',
  price: 25000,
  stock: 10,
  categoryId: 'c1',
  category: { id: 'c1', name: 'Makanan', description: null },
  description: 'Enak',
  isAvailable: true,
  imageUrl: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

const mockProduct2: Product = {
  ...mockProduct,
  id: 'p2',
  name: 'Es Teh',
  price: 5000,
  stock: 5,
  categoryId: 'c2',
  category: { id: 'c2', name: 'Minuman', description: null },
}

const mockCategory: Category = { id: 'c1', name: 'Makanan', description: null }
const mockCategory2: Category = { id: 'c2', name: 'Minuman', description: null }

function setupProductFetch(products: Product[] = [mockProduct, mockProduct2], categories: Category[] = [mockCategory, mockCategory2]) {
  mockFetchApi.mockImplementation(async (url: string) => {
    if (url === '/api/products?limit=100') {
      return { status: 'success', message: 'ok', data: { items: products, total: products.length } }
    }
    if (url === '/api/products/categories') {
      return { status: 'success', message: 'ok', data: { items: categories } }
    }
    return { status: 'success', message: 'ok', data: null }
  })
}

describe('useProducts', () => {
  beforeEach(() => {
    mockFetchApi.mockReset()
  })

  describe('initial load', () => {
    it('fetches products and categories on mount', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.products).toHaveLength(2)
      expect(result.current.categories).toHaveLength(2)
      expect(mockFetchApi).toHaveBeenCalledWith('/api/products?limit=100')
      expect(mockFetchApi).toHaveBeenCalledWith('/api/products/categories')
      expect(result.current.error).toBeNull()
    })

    it('sets error on fetch failure', async () => {
      mockFetchApi.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.products).toHaveLength(0)
    })
  })

  describe('search and filter', () => {
    it('filters products by search query (case-insensitive)', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSearch('teh')
      })

      expect(result.current.products).toHaveLength(1)
      expect(result.current.products[0].name).toBe('Es Teh')
    })

    it('filters products by category', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setCategoryFilter('c2')
      })

      expect(result.current.products).toHaveLength(1)
      expect(result.current.products[0].categoryId).toBe('c2')
    })

    it('returns empty when no products match search', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.setSearch('xyz-nonexistent')
      })

      expect(result.current.products).toHaveLength(0)
    })
  })

  describe('sort', () => {
    it('toggles sort direction when same field clicked', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.sortDir).toBe('asc')

      act(() => {
        result.current.toggleSort('name')
      })

      expect(result.current.sortDir).toBe('desc')
    })

    it('changes sort field when different field clicked', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.toggleSort('price')
      })

      expect(result.current.sortField).toBe('price')
      expect(result.current.sortDir).toBe('asc')
    })

    it('sorts products by price ascending', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => {
        result.current.toggleSort('price')
      })

      expect(result.current.products[0].name).toBe('Es Teh')
      expect(result.current.products[1].name).toBe('Nasi Goreng')
    })
  })

  describe('getProduct', () => {
    it('returns product by id', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      const product = result.current.getProduct('p1')
      expect(product).toBeDefined()
      expect(product!.name).toBe('Nasi Goreng')
    })

    it('returns undefined for unknown id', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      const product = result.current.getProduct('unknown')
      expect(product).toBeUndefined()
    })
  })

  describe('createProduct', () => {
    it('creates product and adds to state', async () => {
      setupProductFetch()
      const newProduct: Product = { ...mockProduct, id: 'p3', name: 'Ayam Goreng' }
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: newProduct,
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      // Reset mock so mutation doesn't use the persistent mockImplementation
      mockFetchApi.mockReset()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: newProduct,
      })

      await act(async () => {
        await result.current.createProduct({
          name: 'Ayam Goreng',
          price: 15000,
          stock: 8,
          categoryId: 'c1',
          description: null,
          isAvailable: true,
          imageUrl: null,
        })
      })

      expect(mockFetchApi).toHaveBeenCalledWith('/api/products', expect.any(Object))
      expect(result.current.getProduct('p3')).toBeDefined()
    })

    it('sets error on create failure', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      mockFetchApi.mockRejectedValueOnce(new Error('Duplicate product'))

      await act(async () => {
        try {
          await result.current.createProduct({
            name: 'Nasi Goreng',
            price: 25000,
            stock: 10,
            categoryId: 'c1',
            description: null,
            isAvailable: true,
            imageUrl: null,
          })
        } catch {
          // expected to re-throw
        }
      })

      expect(result.current.error).toBe('Duplicate product')
    })
  })

  describe('updateProduct', () => {
    it('updates product in state', async () => {
      setupProductFetch()
      const updated = { ...mockProduct, name: 'Nasi Goreng Spesial', price: 30000 }

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: updated,
      })

      await act(async () => {
        await result.current.updateProduct('p1', { name: 'Nasi Goreng Spesial', price: 30000 })
      })

      const product = result.current.getProduct('p1')
      expect(product!.name).toBe('Nasi Goreng Spesial')
      expect(product!.price).toBe(30000)
    })
  })

  describe('deleteProduct', () => {
    it('removes product from state', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: null,
      })

      await act(async () => {
        await result.current.deleteProduct('p1')
      })

      expect(result.current.getProduct('p1')).toBeUndefined()
      expect(mockFetchApi).toHaveBeenCalledWith('/api/products/p1', expect.any(Object))
    })
  })

  describe('category CRUD', () => {
    it('creates category', async () => {
      setupProductFetch()
      const newCat: Category = { id: 'c3', name: 'Snack', description: null }
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: newCat,
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: newCat,
      })

      await act(async () => {
        await result.current.createCategory({ name: 'Snack' })
      })

      expect(result.current.categories).toHaveLength(3)
    })

    it('updates category', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      const updated: Category = { ...mockCategory, name: 'Makanan Berat' }
      mockFetchApi.mockReset()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: updated,
      })

      await act(async () => {
        await result.current.updateCategory('c1', { name: 'Makanan Berat' })
      })

      expect(result.current.categories.find((c) => c.id === 'c1')!.name).toBe('Makanan Berat')
    })

    it('deletes category', async () => {
      setupProductFetch()
      mockFetchApi.mockResolvedValueOnce({
        status: 'success',
        message: 'ok',
        data: null,
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.deleteCategory('c1')
      })

      expect(result.current.categories).toHaveLength(1)
      expect(result.current.categories[0].id).toBe('c2')
    })
  })

  describe('reload', () => {
    it('re-fetches data and clears error', async () => {
      setupProductFetch()

      const { result } = renderHook(() => useProducts())

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetchApi.mockReset()
      setupProductFetch()

      await act(async () => {
        await result.current.reload()
      })

      expect(result.current.products).toHaveLength(2)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })
})
