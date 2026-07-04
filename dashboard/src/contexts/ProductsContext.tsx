import { createContext, useContext, type ReactNode } from 'react'
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

const ProductsContext = createContext<ProductsContextType | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const products = useProducts()
  return (
    <ProductsContext.Provider value={products}>
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
