import { useOrders } from '@/hooks/useOrders.ts'
import OrderListView from '@/components/OrderListView.tsx'
import OrderCardList from '@/components/OrderCardList.tsx'
import Input from '@/components/ui/Input.tsx'
import Select from '@/components/ui/Select.tsx'
import Spinner from '@/components/ui/Spinner.tsx'
import { STATUS_LEGEND } from '@/constants.ts'

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING', label: 'Tertunda' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

export default function Orders() {
  const { orders, loading, search, setSearch, statusFilter, setStatusFilter, sortField, sortDir, toggleSort } = useOrders()

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5 h-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Pesanan</h1>
          <p className="mt-1 text-sm text-stone-500">{orders.length} pesanan ditemukan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
            {STATUS_LEGEND.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                {item.label}
              </span>
            ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama pelanggan atau ID pesanan..."
          className="flex-1"
          prefix={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          }
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
          className="w-full sm:w-44"
        />
      </div>

      {/* Table (desktop) + Card List (mobile) */}
      <div className="hidden min-h-0 flex-1 sm:block">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-stone-100 p-4 text-stone-300">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-stone-900">Tidak ada pesanan</h3>
            <p className="mt-1 max-w-xs text-xs text-stone-500">
              Pesanan dari pelanggan akan muncul di sini
            </p>
          </div>
        ) : (
          <OrderListView
            orders={orders}
            sortField={sortField}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        )}
      </div>

      {/* Mobile card list */}
      <div className="flex-1 sm:hidden">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-stone-100 p-4 text-stone-300">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-stone-900">Tidak ada pesanan</h3>
            <p className="mt-1 max-w-xs text-xs text-stone-500">
              Pesanan dari pelanggan akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto pb-4">
            <OrderCardList
              orders={orders}
              sortField={sortField}
              sortDir={sortDir}
              onSort={toggleSort}
            />
          </div>
        )}
      </div>
    </div>
  )
}
