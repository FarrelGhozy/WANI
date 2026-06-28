import { useNavigate } from 'react-router'
import type { Order, OrderStatus, OrderSortField } from '@/hooks/useOrders.ts'
import Badge from '@/components/ui/Badge.tsx'
import { formatPrice, formatDate } from '@/utils/format'
import type { BadgeVariant } from '@/constants.ts'
import { STATUS_BADGE, STATUS_LABEL } from '@/constants.ts'

interface OrderCardListProps {
  orders: Order[]
  sortField: string
  sortDir: 'asc' | 'desc'
  onSort: (field: OrderSortField) => void
}

export default function OrderCardList({ orders }: OrderCardListProps) {
  const navigate = useNavigate()
  const badgeVar = STATUS_BADGE as Record<OrderStatus, BadgeVariant>
  const labelMap = STATUS_LABEL

  if (orders.length === 0) return null

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <div
          key={order.id}
          onClick={() => navigate(`/orders/${order.id}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate(`/orders/${order.id}`)
          }}
          tabIndex={0}
          role="button"
          aria-label={`Lihat pesanan ${order.id}`}
          className="cursor-pointer rounded-xl border border-stone-200 bg-white p-4 transition-all hover:border-stone-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 active:scale-[0.98]"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-medium text-teal-600">
                #{order.id.split('-')[1].toUpperCase().padStart(3, '0')}
              </span>
              <p className="mt-0.5 text-sm font-medium text-stone-900">{order.customerName}</p>
            </div>
            <Badge variant={badgeVar[order.status]} dot>
              {labelMap[order.status]}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
            <div className="text-xs text-stone-400">
              <span>{order.items.length} item</span>
              <span className="mx-1.5">&middot;</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <span className="text-sm font-semibold text-stone-900 tabular-nums">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
