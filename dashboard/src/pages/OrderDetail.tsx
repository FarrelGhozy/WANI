import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useOrders, formatPrice, type OrderStatus } from '@/hooks/useOrders.ts'
import { fetchApi } from '@/lib/api'
import type { StorePaymentMethod } from '@/types'
import { useToast } from '@/hooks/useToast.ts'
import { formatDate } from '@/utils/format'
import Card from '@/components/ui/Card.tsx'
import Badge from '@/components/ui/Badge.tsx'
import Button from '@/components/ui/Button.tsx'
import Modal from '@/components/ui/Modal.tsx'
import OrderTimeline from '@/components/OrderTimeline.tsx'
import Spinner from '@/components/ui/Spinner.tsx'
import Input from '@/components/ui/Input.tsx'
import type { BadgeVariant } from '@/constants.ts'
import { STATUS_BADGE, STATUS_LABEL } from '@/constants.ts'

const statusBadge = STATUS_BADGE as Record<OrderStatus, BadgeVariant>
const statusLabel = STATUS_LABEL

const statusAction: Record<string, { label: string; variant: 'primary' | 'danger' | 'secondary'; next: OrderStatus }> = {
  PENDING: { label: 'Konfirmasi Pesanan', variant: 'primary', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Mulai Proses', variant: 'primary', next: 'PROCESSING' },
  PROCESSING: { label: 'Tandai Selesai', variant: 'primary', next: 'COMPLETED' },
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getOrder, updateStatus, confirmPayment } = useOrders()
  const { toast } = useToast()
  const order = id ? getOrder(id) : undefined

  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<StorePaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [confirmingPayment, setConfirmingPayment] = useState(false)

  const openPaymentModal = useCallback(async () => {
    setSelectedMethod('')
    setPaymentAmount(order?.totalAmount ?? 0)
    try {
      const res = await fetchApi<StorePaymentMethod[]>('/api/store/payment-methods')
      setPaymentMethods(res.data ?? [])
    } catch {
      setPaymentMethods([])
    }
    setPaymentModal(true)
  }, [order])

  async function handleConfirmPayment() {
    if (!id || !selectedMethod || paymentAmount <= 0) return
    setConfirmingPayment(true)
    try {
      await confirmPayment(id, { method: selectedMethod, amount: paymentAmount })
      toast('Pembayaran berhasil dikonfirmasi', 'success')
      setPaymentModal(false)
    } catch {
      toast('Gagal mengkonfirmasi pembayaran', 'error')
    } finally {
      setConfirmingPayment(false)
    }
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size={24} />
        <p className="mt-4 text-sm text-stone-500">Memuat pesanan...</p>
      </div>
    )
  }

  const action = statusAction[order.status]
  const cancelable = order.status !== 'COMPLETED' && order.status !== 'CANCELLED'
  const paymentPending = !order.payment || order.payment.status === 'PENDING'

  async function handleStatus(next: OrderStatus) {
    if (!id) return
    const labels: Record<OrderStatus, string> = {
      CONFIRMED: 'Pesanan berhasil dikonfirmasi',
      PROCESSING: 'Pesanan sedang diproses',
      COMPLETED: 'Pesanan selesai',
      CANCELLED: 'Pesanan dibatalkan',
      PENDING: '',
    }
    try {
      await updateStatus(id, next)
      toast(labels[next] || 'Status pesanan berhasil diperbarui', 'success')
    } catch {
      toast('Gagal memperbarui status pesanan', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/orders')}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Kembali ke Pesanan
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              Pesanan #{order.id.split('-')[1].toUpperCase().padStart(3, '0')}
            </h1>
            <Badge variant={statusBadge[order.status]} dot>{statusLabel[order.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {order.customerName} &middot; {order.customerPhone}
          </p>
          <p className="text-xs text-stone-400">
            {formatDate(order.createdAt, { long: true })}
          </p>
        </div>

        {/* Actions */}
        {order.status !== 'CANCELLED' && (
          <div className="flex items-center gap-2">
            {paymentPending && (
              <Button size="sm" variant="secondary" onClick={openPaymentModal}>
                Konfirmasi Pembayaran
              </Button>
            )}
            {action && (
              <Button size="sm" onClick={() => handleStatus(action.next)}>
                {action.label}
              </Button>
            )}
            {cancelable && (
              <Button size="sm" variant="danger" onClick={() => handleStatus('CANCELLED')}>
                Batalkan Pesanan
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
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">Item Pesanan</h2>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs text-stone-400">
                  <th className="pb-2 text-left font-medium">Item</th>
                  <th className="pb-2 text-center font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Harga</th>
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
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">Pembayaran</h2>
            {order.payment ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-stone-500">Metode</p>
                  <p className="text-sm font-medium text-stone-900">{order.payment.method ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Jumlah</p>
                  <p className="text-sm font-medium text-stone-900">{formatPrice(order.payment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Status</p>
                  <Badge variant={order.payment.status === 'PAID' ? 'teal' : 'amber'} dot>
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
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">Catatan</h2>
              <p className="text-sm text-stone-700">{order.notes}</p>
            </Card>
          )}
        </div>

        {/* Right: Timeline */}
        <div>
          <Card>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">Riwayat</h2>
            <OrderTimeline
              status={order.status}
              createdAt={order.createdAt}
              updatedAt={order.updatedAt}
              paidAt={order.payment?.paidAt ?? null}
            />
          </Card>
        </div>
      </div>

      {/* Confirm Payment Modal */}
      <Modal
        open={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Konfirmasi Pembayaran"
        actions={
          <Button
            size="sm"
            onClick={handleConfirmPayment}
            loading={confirmingPayment}
            disabled={!selectedMethod || paymentAmount <= 0}
          >
            Konfirmasi
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-500">Metode Pembayaran</label>
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-stone-400">Tidak ada metode pembayaran tersedia</p>
            ) : (
              <div className="space-y-2">
                {paymentMethods
                  .filter((m) => m.isActive)
                  .map((m) => {
                    let meta = ''
                    if (m.type === 'BANK_TRANSFER') meta = `${m.bankName} — ${m.accountNumber}`
                    else if (m.type === 'E_WALLET') meta = m.phoneNumber ?? ''
                    else if (m.type === 'QRIS') meta = 'QRIS'
                    else if (m.type === 'COD') meta = 'Bayar di Tempat'
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMethod(m.type)}
                        className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                          selectedMethod === m.type
                            ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className="font-medium text-stone-900">{m.label}</span>
                        {meta && <span className="ml-2 text-stone-400">{meta}</span>}
                      </button>
                    )
                  })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-500">Jumlah Dibayar</label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              prefix={<span className="text-sm text-stone-400">Rp</span>}
            />
          </div>

          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Setelah dikonfirmasi: Status pembayaran menjadi <strong>LUNAS</strong> dan pesanan otomatis <strong>DIKONFIRMASI</strong>
          </div>
        </div>
      </Modal>
    </div>
  )
}
