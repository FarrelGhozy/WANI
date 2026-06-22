import { useNavigate, useParams } from 'react-router'
import { useOrders, formatPrice, type OrderStatus } from '../hooks/useOrders.ts'
import Card from '../components/ui/Card.tsx'
import Badge from '../components/ui/Badge.tsx'
import Button from '../components/ui/Button.tsx'
import OrderTimeline from '../components/OrderTimeline.tsx'
import Spinner from '../components/ui/Spinner.tsx'

const statusBadge: Record<OrderStatus, 'teal' | 'amber' | 'green' | 'gray' | 'red'> = {
  PENDING: 'amber',
  CONFIRMED: 'teal',
  PROCESSING: 'green',
  COMPLETED: 'gray',
  CANCELLED: 'red',
}

const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const statusAction: Record<string, { label: string; variant: 'primary' | 'danger' | 'secondary'; next: OrderStatus }> = {
  PENDING: { label: 'Confirm Order', variant: 'primary', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Start Processing', variant: 'primary', next: 'PROCESSING' },
  PROCESSING: { label: 'Mark Completed', variant: 'primary', next: 'COMPLETED' },
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getOrder, updateStatus } = useOrders()
  const order = id ? getOrder(id) : undefined

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size={24} />
        <p className="mt-4 text-sm text-stone-500">Loading order...</p>
      </div>
    )
  }

  const action = statusAction[order.status]
  const cancelable = order.status !== 'COMPLETED' && order.status !== 'CANCELLED'

  function handleStatus(next: OrderStatus) {
    if (!id) return
    updateStatus(id, next)
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/orders')}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to Orders
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              Order #{order.id.split('-')[1].toUpperCase().padStart(3, '0')}
            </h1>
            <Badge variant={statusBadge[order.status]} dot>{statusLabel[order.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {order.customerName} &middot; {order.customerPhone}
          </p>
          <p className="text-xs text-stone-400">
            {new Date(order.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        {/* Actions */}
        {order.status !== 'CANCELLED' && (
          <div className="flex items-center gap-2">
            {action && (
              <Button size="sm" onClick={() => handleStatus(action.next)}>
                {action.label}
              </Button>
            )}
            {cancelable && (
              <Button size="sm" variant="danger" onClick={() => handleStatus('CANCELLED')}>
                Cancel Order
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Left: Items + Payment */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card accent="teal">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">Order Items</h2>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs text-stone-400">
                  <th className="pb-2 text-left font-medium">Item</th>
                  <th className="pb-2 text-center font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 text-stone-900">{item.productName}</td>
                    <td className="py-2.5 text-center text-stone-500">{item.qty}</td>
                    <td className="py-2.5 text-right tabular-nums text-stone-500">{formatPrice(item.unitPrice)}</td>
                    <td className="py-2.5 text-right font-medium tabular-nums text-stone-900">{formatPrice(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-stone-200">
                  <td colSpan={3} className="py-3 text-right text-sm font-semibold text-stone-900">Total</td>
                  <td className="py-3 text-right text-sm font-semibold tabular-nums text-stone-900">{formatPrice(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
            </div>
          </Card>

          {/* Payment */}
          <Card accent={order.payment?.status === 'PAID' ? 'amber' : 'none'}>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">Payment</h2>
            {order.payment ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-stone-500">Method</p>
                  <p className="text-sm font-medium text-stone-900">{order.payment.method ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Amount</p>
                  <p className="text-sm font-medium text-stone-900">{formatPrice(order.payment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Status</p>
                  <Badge variant={order.payment.status === 'PAID' ? 'green' : 'amber'} dot>
                    {order.payment.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-400">Belum ada pembayaran</p>
            )}
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">Notes</h2>
              <p className="text-sm text-stone-700">{order.notes}</p>
            </Card>
          )}
        </div>

        {/* Right: Timeline */}
        <div>
          <Card>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">Timeline</h2>
            <OrderTimeline
              status={order.status}
              createdAt={order.createdAt}
              updatedAt={order.updatedAt}
              paidAt={order.payment?.paidAt ?? null}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
