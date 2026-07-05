import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useProducts } from '@/hooks/useProducts.ts'
import type { Product, Category, ProductFormData } from '@/types.ts'

interface ProductsContextType {
  products: Product[]
  categories: Category[]
  loading: boolean
  error: string | null
  search: string
  setSearch: (s: string) => void
  categoryFilter: string
  setCategoryFilter: (s: string) => void
  sortField: 'name' | 'category' | 'price' | 'stock' | 'isAvailable'
  sortDir: 'asc' | 'desc'
  toggleSort: (field: 'name' | 'category' | 'price' | 'stock' | 'isAvailable') => void
  getProduct: (id: string) => Product | undefined
  createProduct: (data: ProductFormData) => Promise<Product | undefined>
  updateProduct: (id: string, data: Partial<ProductFormData>) => Promise<Product | undefined>
  deleteProduct: (id: string) => Promise<void>
  createCategory: (data: { name: string; description?: string | null }) => Promise<Category | undefined>
  updateCategory: (id: string, data: { name?: string; description?: string | null }) => Promise<Category | undefined>
  deleteCategory: (id: string) => Promise<void>
  reload: () => Promise<void>
}

export const ProductsContext = createContext<ProductsContextType | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const {
    products, categories, loading, error, search, setSearch,
    categoryFilter, setCategoryFilter, sortField, sortDir, toggleSort,
    getProduct, createProduct, updateProduct, deleteProduct,
    createCategory, updateCategory, deleteCategory, reload,
  } = useProducts()
  const value = useMemo(
    () => ({
      products, categories, loading, error, search, setSearch,
      categoryFilter, setCategoryFilter, sortField, sortDir, toggleSort,
      getProduct, createProduct, updateProduct, deleteProduct,
      createCategory, updateCategory, deleteCategory, reload,
    }),
    [
      products, categories, loading, error, search, setSearch,
      categoryFilter, setCategoryFilter, sortField, sortDir, toggleSort,
      getProduct, createProduct, updateProduct, deleteProduct,
      createCategory, updateCategory, deleteCategory, reload,
    ],
  )
  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProductsContext(): ProductsContextType {
  const ctx = useContext(ProductsContext)
  if (!ctx) {
    throw new Error('useProductsContext must be used within a ProductsProvider')
  }
  return ctx
}
