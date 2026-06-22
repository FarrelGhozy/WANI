import { useLocation } from 'react-router'

function pathToLabel(path: string): string {
  if (path === '/') return 'Dashboard'
  const segment = path.split('/').filter(Boolean)[0]
  if (!segment) return 'Dashboard'
  return segment
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
  const currentPage = pathToLabel(location.pathname)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-white/80 px-8 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-stone-400">Home</span>
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
