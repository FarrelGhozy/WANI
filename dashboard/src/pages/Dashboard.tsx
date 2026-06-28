import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useOrders, type OrderStatus } from '@/hooks/useOrders.ts'
import { useProducts } from '@/hooks/useProducts.ts'
import { useCustomers } from '@/hooks/useCustomers.ts'
import { useWaStatus } from '@/hooks/useWaStatus.ts'
import { fetchApi } from '@/lib/api.ts'
import StatusCard from '@/components/StatusCard.tsx'
import Badge from '@/components/ui/Badge.tsx'
import Spinner from '@/components/ui/Spinner.tsx'
import type { BadgeVariant } from '@/constants.ts'
import { STATUS_BADGE, STATUS_LABEL, statusDot, statusLabel } from '@/constants.ts'
import { formatPrice, formatDate } from '@/utils/format'
import { SignalIcon, BagIcon, ClipboardIcon, PeopleIcon } from '@/components/Icons.tsx'

const statusBadgeVariant: Record<OrderStatus, BadgeVariant> = STATUS_BADGE
const statusLabelMap = STATUS_LABEL

function mapAccent(connection: string): BadgeVariant {
  if (connection === 'connected') return 'teal'
  if (connection === 'connecting') return 'amber'
  return 'red'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { orders, loading: ordersLoading } = useOrders()
  const { products, loading: prodLoading } = useProducts()
  const { allCustomers, loading: custLoading } = useCustomers()
  const { qr, connection, phone, connectedAt, loading: waLoading } = useWaStatus()

  const [hasPaymentMethods, setHasPaymentMethods] = useState(false)
  const [storeName, setStoreName] = useState('')

  // Fetch store info
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchApi<{ businessName: string; hasPaymentMethods: boolean }>('/api/store')
        if (res.data && !cancelled) {
          setStoreName(res.data.businessName || '')
          setHasPaymentMethods(res.data.hasPaymentMethods || false)
        }
      } catch {
        // silent — use defaults
      }
    })()
    return () => { cancelled = true }
  }, [])

  const loading = waLoading || ordersLoading || prodLoading || custLoading

  // Derived data
  const pendingOrders = orders.filter((o) => o.status === 'PENDING')
  const activeProducts = products.filter((p) => p.isAvailable)
  const attentionProducts = products.filter((p) => !p.isAvailable || p.stock === 0)
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5)

  const recentPending = pendingOrders.slice(0, 5)

  const totalRevenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0)

  const totalUnread = allCustomers.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton */}
        <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-stone-100" />
        <div className="h-40 animate-pulse rounded-xl bg-stone-100" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            {storeName || 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Ringkasan bisnis UMKM Anda
          </p>
        </div>
      </div>

      {/* WA Connection Banner */}
      {connection === 'connected' && (
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3">
          <span className={`h-2.5 w-2.5 rounded-full ${statusDot(connection)}`} />
          <div className="flex-1">
            <p className="text-sm font-medium text-teal-800">WhatsApp Terhubung</p>
            <p className="text-xs text-teal-600">{phone} &middot; Bot aktif melayani pelanggan</p>
          </div>
          <Badge variant="teal" dot>Online</Badge>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          icon={<span className="text-lg font-bold text-stone-600">Rp</span>}
          accent="teal"
          label="Total Pendapatan"
          value={formatPrice(totalRevenue)}
          sub={`Dari ${orders.filter(o => o.status === 'COMPLETED').length} pesanan selesai`}
        />
        <StatusCard
          icon={<ClipboardIcon />}
          accent="amber"
          label="Perlu Diproses"
          value={String(pendingOrders.length)}
          sub="Menunggu konfirmasi"
        />
        <StatusCard
          icon={<BagIcon />}
          accent="teal"
          label="Produk Aktif"
          value={`${activeProducts.length}/${products.length}`}
          sub={attentionProducts.length > 0 ? `${attentionProducts.length} perlu perhatian` : 'Semua dalam stok'}
        />
        <StatusCard
          icon={<PeopleIcon />}
          accent="teal"
          label="Pelanggan"
          value={String(allCustomers.length)}
          sub={totalUnread > 0 ? `${totalUnread} pesan belum dibaca` : 'Semua pesan terbaca'}
        />
      </div>

      {/* Grid: Recent Orders + WA Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Orders Table */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-stone-900">Pesanan Perlu Diproses</h2>
            {pendingOrders.length > 0 && (
              <Link to="/orders" className="text-xs font-medium text-teal-600 hover:text-teal-700">
                Lihat semua &rarr;
              </Link>
            )}
          </div>
          {recentPending.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <p className="text-sm font-medium text-stone-500">Semua pesanan selesai &check;</p>
              <p className="mt-1 text-xs text-stone-400">Tidak ada pesanan yang perlu diproses.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {recentPending.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/orders/${order.id}`) }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Lihat pesanan ${order.id}`}
                  className="flex cursor-pointer items-center justify-between px-5 py-3 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={statusBadgeVariant[order.status]} dot>
                      {statusLabelMap[order.status]}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-stone-900">{order.customerName}</p>
                      <p className="text-xs text-stone-400">
                        {order.items.length} item &middot; {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-stone-900">{formatPrice(order.totalAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WA Status Card */}
        <div className="rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-stone-900">WhatsApp</h2>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-3 ${connection === 'connected' ? 'bg-teal-50 text-teal-500' : 'bg-stone-100 text-stone-400'}`}>
                <SignalIcon />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">{statusLabel(connection)}</p>
                <p className="text-xs text-stone-400">{phone || '-'}</p>
              </div>
            </div>

            {connection === 'connected' && connectedAt && (
              <p className="mt-3 text-xs text-stone-400">
                Terhubung sejak {formatDate(connectedAt, { long: true, withTz: true })}
              </p>
            )}

            <div className="mt-4 space-y-2">
              {/* Payment Methods Warning */}
              {!hasPaymentMethods && (
                <div className="rounded-lg bg-amber-50 px-4 py-3">
                  <p className="text-xs font-medium text-amber-800">Metode Pembayaran Belum Diatur</p>
                  <p className="mt-1 text-xs text-amber-600">Atur metode pembayaran agar pelanggan dapat melakukan checkout.</p>
                </div>
              )}

              {/* Low Stock Alert */}
              {lowStockProducts.length > 0 && (
                <div className="rounded-lg bg-amber-50 px-4 py-3">
                  <p className="text-xs font-medium text-amber-800">Stok Menipis</p>
                  <p className="mt-1 text-xs text-amber-600">
                    {lowStockProducts.length} produk hampir habis.
                  </p>
                </div>
              )}

              {/* All good */}
              {hasPaymentMethods && lowStockProducts.length === 0 && (
                <div className="rounded-lg bg-teal-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-teal-600"><polyline points="20 6 9 17 4 12" /></svg>
                    <p className="text-xs font-medium text-teal-800">Semua dalam kondisi baik</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
