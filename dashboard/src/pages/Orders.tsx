import { useOrders } from '@/hooks/useOrders.ts'
import OrderListView from '@/components/OrderListView.tsx'
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton.tsx'

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING', label: 'Tertunda' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

export default function Orders() {
  const { orders, loading, error, reload, search, setSearch, statusFilter, setStatusFilter, sortField, sortDir, toggleSort } = useOrders()

  if (loading) {
    return (
      <div className="max-lg:flex max-lg:h-[calc(100dvh-12rem)] max-lg:flex-col lg:space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Skeleton variant="text" className="h-7 w-28" />
            <Skeleton variant="text" className="mt-2 h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton variant="rectangular" className="h-10 flex-1" />
          <Skeleton variant="rectangular" className="h-10 w-44" />
        </div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    )
  }

  return (
    <div className="max-lg:flex max-lg:h-[calc(100dvh-12rem)] max-lg:flex-col lg:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Pesanan</h1>
          <p className="mt-1 text-sm text-stone-500">{orders.length} pesanan ditemukan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Tertunda
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-400" /> Dikonfirmasi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Diproses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-stone-400" /> Selesai
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Dibatalkan
            </span>
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pelanggan atau ID pesanan..."
            className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-44"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Empty */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-stone-100 p-4 text-stone-300">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 1h2l1 3h10l-1 6H6L5 4" /><circle cx="7" cy="17" r="1.5" /><circle cx="14" cy="17" r="1.5" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-stone-900">
            {search || statusFilter ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan'}
          </h3>
        </div>
      )}

      {/* List */}
      {orders.length > 0 && (
        <div className="max-lg:flex-1 max-lg:overflow-auto">
          <OrderListView orders={orders} sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
        </div>
      )}
    </div>
  )
}
