import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useProductsContext } from '@/contexts/ProductsContext.tsx'
import { useToast } from '@/hooks/useToast.ts'
import ProductListView from '@/components/ProductListView.tsx'
import ProductCard from '@/components/ProductCard.tsx'
import CategoryModal from '@/components/CategoryModal.tsx'
import Button from '@/components/ui/Button.tsx'
import Pagination from '@/components/ui/Pagination.tsx'
import Modal from '@/components/ui/Modal.tsx'
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton.tsx'

const CARD_LIMIT = 20

export default function Products() {
  const navigate = useNavigate()
  const {
    products, categories, loading, error, reload,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    sortField, sortDir, toggleSort,
    deleteProduct,
    createCategory, updateCategory, deleteCategory,
  } = useProductsContext()
  const { toast, apiError } = useToast()

  const [view, setView] = useState<'list' | 'card'>('list')
  const [cardPage, setCardPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const deleteTarget = deleteId ? products.find((p) => p.id === deleteId) : null

  const cardTotalPages = Math.max(1, Math.ceil(products.length / CARD_LIMIT))
  const cardProducts = products.slice((cardPage - 1) * CARD_LIMIT, cardPage * CARD_LIMIT)
  const safeCardPage = Math.min(cardPage, cardTotalPages)

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id)
      toast('Produk berhasil dihapus', 'success')
      setDeleteId(null)
    } catch (e) {
      apiError(e, 'Gagal menghapus produk')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Skeleton variant="text" className="h-7 w-24" />
            <Skeleton variant="text" className="mt-2 h-4 w-36" />
          </div>
          <div className="flex gap-3">
            <Skeleton variant="rectangular" className="h-10 w-24" />
            <Skeleton variant="rectangular" className="h-10 w-32" />
            <Skeleton variant="rectangular" className="h-10 w-36" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton variant="rectangular" className="h-10 flex-1" />
          <Skeleton variant="rectangular" className="h-10 w-44" />
        </div>
        <SkeletonTable rows={6} cols={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Produk</h1>
          <p className="mt-1 text-sm text-stone-500">{products.length} produk UMKM Anda</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="flex overflow-hidden rounded-lg border border-stone-300 bg-white">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'list' ? 'bg-teal-50 text-teal-700' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              List
            </button>
            <button
              onClick={() => setView('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'card' ? 'bg-teal-50 text-teal-700' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Grid
            </button>
          </div>
          <Button variant="secondary" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          } onClick={() => setCategoryModalOpen(true)}>
            Kelola Kategori
          </Button>
          <Button icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
           } onClick={() => navigate('/app/products/new')}>
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={reload}
              className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (view === 'card') setCardPage(1) }}
            placeholder="Cari produk..."
            className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); if (view === 'card') setCardPage(1) }}
          className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-44"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-stone-100 p-4 text-stone-300">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-stone-900">
            {search || categoryFilter ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            {search || categoryFilter ? 'Coba ubah kata kunci atau filter' : 'Klik "Tambah Produk" untuk menambahkan produk pertama'}
          </p>
        </div>
      )}

      {/* List view — all products, no pagination */}
      {view === 'list' && products.length > 0 && (
        <ProductListView products={products} onDelete={setDeleteId} sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
      )}

      {/* Card view — paginated, 20/page */}
      {view === 'card' && cardProducts.length > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cardProducts.map((item) => (
              <ProductCard key={item.id} product={item} onDelete={setDeleteId} />
            ))}
          </div>
          <Pagination page={safeCardPage} totalPages={cardTotalPages} onPageChange={setCardPage} />
        </>
      )}

      {/* Delete Modal */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Hapus Produk"
        actions={
          <Button variant="danger" size="sm" onClick={() => handleDelete(deleteId!)}>
            Hapus
          </Button>
        }
      >
        <p className="text-sm text-stone-600">
          Yakin ingin menghapus <strong className="text-stone-900">{deleteTarget?.name}</strong>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>

      {/* Category Modal */}
      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </div>
  )
}
