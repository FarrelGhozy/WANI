import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth.ts'
import { LogOutIcon } from '@/components/Icons.tsx'

const segmentLabels: Record<string, string> = {
  products: 'Produk',
  orders: 'Pesanan',
  customers: 'Pelanggan',
  website: 'Website',
  settings: 'Pengaturan',
}

function buildCrumbs(pathname: string): { label: string; to: string }[] {
  const crumbs: { label: string; to: string }[] = [{ label: 'Beranda', to: '/app' }]
  const segments = pathname.split('/').filter(Boolean).slice(1)
  if (segments.length === 0) return crumbs

  let accumulated = '/app'
  for (let i = 0; i < segments.length; i++) {
    accumulated += '/' + segments[i]
    const label = segmentLabels[segments[i]]
      ?? (i > 0 && /^[a-f0-9-]+$/i.test(segments[i])
        ? 'Detail'
        : segments[i].charAt(0).toUpperCase() + segments[i].slice(1))
    crumbs.push({ label, to: accumulated })
  }

  return crumbs
}

interface TopbarProps {
  connection: string
}

function statusDot(status: string) {
  switch (status) {
    case 'connected': return 'bg-emerald-500'
    case 'connecting': return 'bg-amber-500'
    default: return 'bg-red-500'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'connected': return 'Terhubung'
    case 'connecting': return 'Menghubungkan'
    default: return 'Terputus'
  }
}

export default function Topbar({ connection }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const crumbs = buildCrumbs(location.pathname)

  function handleLogout() {
    logout()
    navigate('/app/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-white/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.to} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-stone-300">/</span>}
            {i < crumbs.length - 1 ? (
              <button
                onClick={() => navigate(crumb.to)}
                className="text-stone-400 transition-colors hover:text-stone-700"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="font-medium text-stone-900">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleLogout}
          className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 lg:hidden"
          aria-label="Keluar"
        >
          <LogOutIcon />
        </button>
        <span className={`h-2 w-2 rounded-full ${statusDot(connection)}`} />
        <span className="text-xs font-medium text-stone-500">{statusLabel(connection)}</span>
      </div>
    </header>
  )
}
