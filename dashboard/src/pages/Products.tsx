import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useProducts, type Product } from '../hooks/useProducts.ts'
import Table, { type Column } from '../components/ui/Table.tsx'
import Button from '../components/ui/Button.tsx'
import Badge from '../components/ui/Badge.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import Modal from '../components/ui/Modal.tsx'
import Spinner from '../components/ui/Spinner.tsx'

type DataRow = Product & { index: number; actions: ReactNode }

function formatPrice(price: number) {
  return `Rp${price.toLocaleString('id-ID')}`
}

function sortArrow(field: string, currentField: string, dir: 'asc' | 'desc') {
  if (field !== currentField) return null
  return (
    <span className="ml-1 inline-block text-teal-600">
      {dir === 'asc' ? '\u2191' : '\u2193'}
    </span>
  )
}

const columns: Column<Product>[] = [
  {
    key: 'index',
    header: '#',
    className: 'w-10 text-stone-400',
    render: () => '',
  },
  {
    key: 'name',
    header: 'Product',
    render: (item: Product) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-medium text-stone-400">
          {item.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-stone-900">{item.name}</p>
          {item.category && (
            <p className="text-xs text-stone-400">{item.category.name}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    className: 'text-right font-medium tabular-nums',
    render: (item: Product) => formatPrice(item.price),
  },
  {
    key: 'stock',
    header: 'Stock',
    className: 'text-center tabular-nums',
    render: (item: Product) => (
      <span className={item.stock === 0 ? 'text-red-500' : 'text-stone-700'}>{item.stock}</span>
    ),
  },
  {
    key: 'isAvailable',
    header: 'Status',
    render: (item: Product) => (
      <Badge variant={item.isAvailable ? 'green' : 'red'} dot>
        {item.isAvailable ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'w-20 text-right',
    render: () => '',
  },
]

export default function Products() {
  const navigate = useNavigate()
  const {
    products, allProducts, categories, loading,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    sortField, sortDir, toggleSort,
    page, totalPages, setPage,
    deleteProduct,
  } = useProducts()

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deleteTarget = deleteId ? allProducts.find((p) => p.id === deleteId) : null

  const headerColumns = columns.map((col) => {
    if (col.key === 'index') return { ...col, header: '' }
    if (col.key === 'actions') return col
    const sortableKeys = ['name', 'price', 'stock']
    return {
      ...col,
      header: (
        <button
          onClick={() => { if (sortableKeys.includes(col.key)) toggleSort(col.key as 'name' | 'price' | 'stock') }}
          className={`inline-flex items-center transition-colors ${sortableKeys.includes(col.key) ? 'hover:text-stone-700' : ''}`}
        >
          {col.header}
          {sortArrow(col.key, sortField, sortDir)}
        </button>
      ),
    }
  })

  const dataRows = products.map((item, idx) => ({
    ...item,
    index: (page - 1) * 8 + idx + 1,
    actions: (
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/products/${item.id}`) }}
          className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-teal-600"
          title="Edit"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteId(item.id) }}
          className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
          title="Delete"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    ),
  }))

  const tableColumns = headerColumns.map((col) => {
    if (col.key === 'index') return { ...col, render: (item: DataRow) => item.index }
    if (col.key === 'actions') return { ...col, render: (item: DataRow) => item.actions }
    return col as Column<DataRow>
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Products</h1>
          <p className="mt-1 text-sm text-stone-500">Daftar produk UMKM Anda</p>
        </div>
        <Button icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        } onClick={() => navigate('/products/new')}>
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-44"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner size={24} /></div>
      ) : (
        <>
          <Table
            columns={tableColumns}
            data={dataRows}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => navigate(`/products/${item.id}`)}
            emptyIcon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 6l7-4 7 4-7 4-7-4z" /><path d="M3 10l7 4 7-4" /><path d="M3 14l7 4 7-4" /></svg>
            }
            emptyTitle={search || categoryFilter ? 'No products match your search' : 'Belum ada produk'}
            emptyDescription={search || categoryFilter ? 'Try different search terms or filters' : 'Klik "Add Product" untuk menambahkan produk pertama'}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Delete Modal */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Hapus Produk"
        actions={
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (deleteId) deleteProduct(deleteId)
              setDeleteId(null)
            }}
          >
            Hapus
          </Button>
        }
      >
        <p className="text-sm text-stone-600">
          Yakin ingin menghapus <strong className="text-stone-900">{deleteTarget?.name}</strong>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>
    </div>
  )
}
