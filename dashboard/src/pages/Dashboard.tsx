import { useWaStatus } from '../hooks/useWaStatus.ts'
import QRCode from '../components/QRCode.tsx'
import StatusCard from '../components/StatusCard.tsx'
import Card from '../components/ui/Card.tsx'
import { SignalIcon, PhoneIcon, CartIcon } from '../components/Icons.tsx'

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
  const { qr, connection, phone, loading, error } = useWaStatus()

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-6 w-48 animate-pulse rounded bg-stone-200" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-stone-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-red-50 p-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <p className="text-sm font-medium text-stone-900">Gagal memuat data</p>
        <p className="mt-1 text-xs text-stone-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">Overview bisnis dan koneksi WhatsApp</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatusCard
          label="Connection"
          value={connectionLabel(connection)}
          accent={mapAccent(connection)}
          icon={<SignalIcon />}
          subText={connection === 'connected' ? 'Bot aktif melayani' : 'Menunggu koneksi'}
        />
        <StatusCard
          label="Phone Number"
          value={phone || 'Belum terhubung'}
          accent={phone ? 'teal' : 'amber'}
          icon={<PhoneIcon />}
          subText={phone ? 'Nomor terdaftar' : 'Scan QR untuk menghubungkan'}
        />
        <StatusCard
          label="Orders Today"
          value="12"
          accent="amber"
          icon={<CartIcon />}
          subText="3 pesanan baru"
        />
      </div>

      {/* QR Code Section */}
      <Card accent="teal">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <QRCode value={qr} />
          <div className="space-y-3 text-center sm:text-left">
            <h2 className="text-base font-semibold text-stone-900">WhatsApp Connection</h2>
            <p className="text-sm leading-relaxed text-stone-500">
              Scan QR code ini dengan aplikasi WhatsApp di ponsel Anda.
            </p>
            <ol className="space-y-2 text-sm text-stone-500">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-medium text-teal-600">1</span>
                <span>Buka WhatsApp {'>'}{' '}<strong className="text-stone-700">Linked Devices</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-medium text-teal-600">2</span>
                <span>Ketuk <strong className="text-stone-700">Link a Device</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-medium text-teal-600">3</span>
                <span>Arahkan kamera ke QR code ini</span>
              </li>
            </ol>
            {connection === 'connected' && (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Sudah terhubung
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-teal-50 p-3 text-teal-600">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="1" width="14" height="18" rx="2" />
                <path d="M7 5h6M7 9h6M7 13h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Lihat Products</p>
              <p className="text-xs text-stone-500">{24} produk aktif</p>
            </div>
          </div>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 1h2l1 3h10l-1 6H6L5 4" />
                <circle cx="7" cy="17" r="1.5" />
                <circle cx="14" cy="17" r="1.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Lihat Orders</p>
              <p className="text-xs text-stone-500">{5} pesanan pending</p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  )
}
