import { useNavigate } from 'react-router'
import type { Order, OrderStatus, OrderSortField } from '@/hooks/useOrders.ts'
import Badge from '@/components/ui/Badge.tsx'
import type { BadgeVariant } from '@/constants.ts'
import { STATUS_BADGE, STATUS_LABEL } from '@/constants.ts'
import { formatPrice, formatDate } from '@/utils/format'

interface OrderListViewProps {
  orders: Order[]
  sortField: string
  sortDir: 'asc' | 'desc'
  onSort: (field: OrderSortField) => void
}

const badgeVar = STATUS_BADGE as Record<OrderStatus, BadgeVariant>
const labelMap = STATUS_LABEL

function SortArrow({ field, current, dir }: { field: string; current: string; dir: 'asc' | 'desc' }) {
  if (field !== current) return null
  return <span className="ml-1 text-teal-600">{dir === 'asc' ? '\u2191' : '\u2193'}</span>
}

function SortTh({ field, label, current, dir, onSort, className }: { field: OrderSortField; label: string; current: string; dir: 'asc' | 'desc'; onSort: (f: OrderSortField) => void; className?: string }) {
  return (
    <th className={`max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3 text-xs font-medium uppercase tracking-wider ${className ?? ''}`}>
      <button onClick={() => onSort(field)} className="inline-flex items-center text-stone-500 transition-colors hover:text-stone-700">
        {label}
        <SortArrow field={field} current={current} dir={dir} />
      </button>
    </th>
  )
}

export default function OrderListView({ orders, sortField, sortDir, onSort }: OrderListViewProps) {
  const navigate = useNavigate()

  if (orders.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white h-full">
      <table className="w-full border-collapse text-left max-sm:text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-stone-100 bg-stone-50">
            <SortTh field="id" label="Pesanan" current={sortField} dir={sortDir} onSort={onSort} />
            <SortTh field="customerName" label="Pelanggan" current={sortField} dir={sortDir} onSort={onSort} />
            <SortTh field="items" label="Item" current={sortField} dir={sortDir} onSort={onSort} />
            <SortTh field="totalAmount" label="Total" current={sortField} dir={sortDir} onSort={onSort} className="text-right" />
            <SortTh field="status" label="Status" current={sortField} dir={sortDir} onSort={onSort} />
            <SortTh field="createdAt" label="Tanggal" current={sortField} dir={sortDir} onSort={onSort} className="text-right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/orders/${order.id}`) }}
              tabIndex={0}
              role="button"
              aria-label={`Lihat pesanan ${order.id}`}
              className="cursor-pointer transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500/40"
            >
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3">
                <span className="font-mono text-xs font-medium text-teal-600">#{order.id.split('-')[1].toUpperCase().padStart(3, '0')}</span>
              </td>
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3">
                <div>
                  <p className="max-sm:text-xs sm:text-sm font-medium text-stone-900">{order.customerName}</p>
                  <p className="text-xs text-stone-400">{order.customerPhone}</p>
                </div>
              </td>
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3 text-xs text-stone-500">{order.items.length} item</td>
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3 text-right font-medium tabular-nums text-stone-900">{formatPrice(order.totalAmount)}</td>
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3">
                <Badge variant={badgeVar[order.status]} dot>{labelMap[order.status]}</Badge>
              </td>
              <td className="max-sm:px-2 max-sm:py-2 sm:px-4 sm:py-3 text-right text-xs text-stone-400">
                {formatDate(order.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
