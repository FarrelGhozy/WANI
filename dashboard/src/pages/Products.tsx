import { useProducts } from '@/hooks/useProducts.ts'
import ProductListView from '@/components/ProductListView.tsx'
import Input from '@/components/ui/Input.tsx'
import Spinner from '@/components/ui/Spinner.tsx'

export default function Products() {
  const { products, loading, categories, search, setSearch, categoryFilter, setCategoryFilter, sortField, sortDir, toggleSort, deleteProduct } = useProducts()

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Produk</h1>
          <p className="mt-1 text-sm text-stone-500">{products.length} produk</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama produk..."
          className="flex-1 min-w-0"
          prefix={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          }
        />
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-44"
            aria-label="Filter kategori"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat: Category) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-stone-100 p-4 text-stone-300">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-stone-900">Tidak ada produk</h3>
          <p className="mt-1 max-w-xs text-xs text-stone-500">
            Tambahkan produk baru untuk mulai berjualan
          </p>
        </div>
      ) : (
        <ProductListView
          products={products}
          onDelete={deleteProduct}
          sortField={sortField}
          sortDir={sortDir}
          onSort={toggleSort}
        />
      )}
    </div>
  )
}
