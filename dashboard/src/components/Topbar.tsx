import { useLocation, useNavigate } from 'react-router'

function pathToLabel(path: string): string {
  if (path === '/') return 'Dashboard'
  const segment = path.split('/').filter(Boolean)[0]
  if (!segment) return 'Dashboard'
  const map: Record<string, string> = {
    products: 'Produk',
    orders: 'Pesanan',
    customers: 'Pelanggan',
    website: 'Website',
    settings: 'Pengaturan',
  }
  return map[segment] ?? segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
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

export default function Topbar({ connection }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPage = pathToLabel(location.pathname)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-white/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/')} className="text-stone-400 transition-colors hover:text-stone-700">Beranda</button>
        <span className="text-stone-300">/</span>
        <span className="font-medium text-stone-900">{currentPage}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${statusDot(connection)}`} />
        <span className="text-xs font-medium capitalize text-stone-500">{connection}</span>
      </div>
    </header>
  )
}
