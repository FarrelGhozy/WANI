import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useWaStatus } from '../hooks/useWaStatus.ts'
import { useOrders } from '../hooks/useOrders.ts'
import { useProducts } from '../hooks/useProducts.ts'
import { useCustomers } from '../hooks/useCustomers.ts'
import StatusCard from '../components/StatusCard.tsx'
import Card from '../components/ui/Card.tsx'
import Badge from '../components/ui/Badge.tsx'
import QRCode from '../components/QRCode.tsx'
import { SignalIcon, BagIcon, ClipboardIcon, PeopleIcon } from '../components/Icons.tsx'

const statusBadgeVariant: Record<string, 'amber' | 'teal' | 'green' | 'gray' | 'red'> = {
  PENDING: 'amber',
  CONFIRMED: 'teal',
  PROCESSING: 'green',
  COMPLETED: 'gray',
  CANCELLED: 'red',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

function formatPrice(price: number) {
  return `Rp${price.toLocaleString('id-ID')}`
}

function mapAccent(status: string): 'teal' | 'amber' | 'red' {
  switch (status) {
    case 'connected': return 'teal'
    case 'connecting': return 'amber'
    default: return 'red'
  }
}

function connectionLabel(status: string): string {
  switch (status) {
    case 'connected': return 'Connected'
    case 'connecting': return 'Connecting\u2026'
    default: return 'Disconnected'
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { qr, connection, phone, loading: waLoading } = useWaStatus()
  const { allOrders, loading: ordersLoading } = useOrders()
  const { products, loading: prodLoading } = useProducts()
  const { allCustomers, loading: custLoading } = useCustomers()

  const loading = waLoading || ordersLoading || prodLoading || custLoading

  const totalRevenue = useMemo(
    () => allOrders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.totalAmount, 0),
    [allOrders],
  )

  const pendingProcessOrders = useMemo(
    () => allOrders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED'),
    [allOrders],
  )

  const activeProducts = useMemo(
    () => products.filter((p) => p.isAvailable),
    [products],
  )

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock === 0 || !p.isAvailable),
    [products],
  )

  const unreadCustomerCount = useMemo(
    () => allCustomers.filter((c) => c.unreadCount > 0).length,
    [allCustomers],
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 animate-pulse rounded bg-stone-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-stone-100" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">Ringkasan bisnis dan status penting</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          label="Total Revenue"
          value={formatPrice(totalRevenue)}
          accent="teal"
          icon={<BagIcon />}
          subText="Dari pesanan selesai"
        />
        <StatusCard
          label="Perlu Diproses"
          value={String(pendingProcessOrders.length)}
          accent={pendingProcessOrders.length > 0 ? 'amber' : 'teal'}
          icon={<ClipboardIcon />}
          subText={pendingProcessOrders.length > 0 ? 'Pending / Confirmed' : 'Semua sudah diproses'}
        />
        <StatusCard
          label="Produk Aktif"
          value={`${activeProducts.length}/${products.length}`}
          accent={activeProducts.length > 0 ? 'teal' : 'red'}
          icon={<BagIcon />}
          subText={`${lowStockProducts.length} perlu perhatian`}
        />
        <StatusCard
          label="Pelanggan"
          value={String(allCustomers.length)}
          accent="teal"
          icon={<PeopleIcon />}
          subText={unreadCustomerCount > 0 ? `${unreadCustomerCount} pesan belum dibaca` : 'Tidak ada pesan baru'}
        />
      </div>

      {/* Pending Orders List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-900">Pesanan Perlu Diproses</h2>
          {pendingProcessOrders.length > 0 && (
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-medium text-teal-600 transition-colors hover:text-teal-700"
            >
              Lihat Semua &rarr;
            </button>
          )}
        </div>
        {pendingProcessOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 rounded-full bg-emerald-50 p-3 text-emerald-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <p className="text-sm font-medium text-stone-900">Semua pesanan sudah diproses</p>
            <p className="mt-1 text-xs text-stone-500">Tidak ada pesanan yang menunggu konfirmasi</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {pendingProcessOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex cursor-pointer items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-stone-50 -mx-1 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 font-mono text-xs font-medium text-teal-600">
                    #{order.id.split('-')[1].toUpperCase().padStart(3, '0')}
                  </span>
                  <span className="truncate text-sm font-medium text-stone-900">
                    {order.customerName}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:block text-xs text-stone-400">
                    {formatPrice(order.totalAmount)}
                  </span>
                  <Badge variant={statusBadgeVariant[order.status]} dot>
                    {statusLabel[order.status]}
                  </Badge>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-stone-300">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bottom Row: WhatsApp + Stock Alert */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* WhatsApp Connection */}
        <Card>
          <div className="flex items-start gap-4">
            <div className={`rounded-lg p-2.5 ${
              connection === 'connected' ? 'bg-emerald-50 text-emerald-600' :
              connection === 'connecting' ? 'bg-amber-50 text-amber-600' :
              'bg-red-50 text-red-600'
            }`}>
              <SignalIcon />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-stone-900">WhatsApp</h3>
                <Badge variant={mapAccent(connection)} dot>
                  {connectionLabel(connection)}
                </Badge>
              </div>
              {phone && (
                <p className="mt-0.5 text-xs text-stone-500">{phone}</p>
              )}
              {connection === 'disconnected' || connection === 'connecting' ? (
                <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
                  <QRCode value={qr} />
                  <p className="text-xs text-stone-400 sm:text-left text-center">
                    Scan QR code dengan WhatsApp untuk menghubungkan
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-stone-500">
                  Bot aktif melayani pelanggan
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Stock Alert */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-lg p-2.5 bg-amber-50 text-amber-600">
              <BagIcon />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-stone-900">Perhatian Stok</h3>
              {lowStockProducts.length === 0 ? (
                <div className="mt-3 flex flex-col items-center justify-center py-6 text-center">
                  <div className="mb-2 rounded-full bg-emerald-50 p-2 text-emerald-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <path d="M22 4L12 14.01l-3-3" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-stone-900">Semua stok aman</p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-stone-100">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="flex cursor-pointer items-center justify-between py-2 transition-colors hover:text-teal-600"
                    >
                      <span className="text-sm text-stone-700">{product.name}</span>
                      <span className={`text-xs font-medium ${product.stock === 0 ? 'text-red-500' : 'text-stone-400'}`}>
                        {product.isAvailable ? `Stok: ${product.stock}` : 'Tidak aktif'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

      </div>

    </div>
  )
}
