import { useNavigate } from 'react-router'
import type { Order, OrderStatus } from '../hooks/useOrders.ts'
import Badge from './ui/Badge.tsx'

interface OrderListViewProps {
  orders: Order[]
}

const statusBadge: Record<OrderStatus, 'amber' | 'green' | 'teal' | 'red'> = {
  PENDING: 'amber',
  CONFIRMED: 'green',
  PROCESSING: 'teal',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

function formatPrice(price: number) {
  return `Rp${price.toLocaleString('id-ID')}`
}

export default function OrderListView({ orders }: OrderListViewProps) {
  const navigate = useNavigate()

  if (orders.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-stone-100 bg-stone-50">
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-stone-500">Order</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-stone-500">Customer</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-stone-500">Items</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">Total</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-stone-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="cursor-pointer transition-colors hover:bg-stone-50"
            >
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-medium text-teal-600">#{order.id.split('-')[1].toUpperCase().padStart(3, '0')}</span>
              </td>
              <td className="px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">{order.customerName}</p>
                  <p className="text-xs text-stone-400">{order.customerPhone}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-stone-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</td>
              <td className="px-4 py-3 text-right font-medium tabular-nums text-stone-900">{formatPrice(order.totalAmount)}</td>
              <td className="px-4 py-3">
                <Badge variant={statusBadge[order.status]} dot>{statusLabel[order.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-right text-xs text-stone-400">
                {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
