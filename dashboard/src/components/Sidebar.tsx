import { useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth.ts'
import { GridIcon, BagIcon, ClipboardIcon, PeopleIcon, GlobeIcon, CogIcon, LogOutIcon } from './Icons.tsx'

const navItems = [
  { to: '/', icon: GridIcon, label: 'Dashboard' },
  { to: '/products', icon: BagIcon, label: 'Products' },
  { to: '/orders', icon: ClipboardIcon, label: 'Orders' },
  { to: '/customers', icon: PeopleIcon, label: 'Customers' },
  { to: '/website', icon: GlobeIcon, label: 'Website' },
  { to: '/settings', icon: CogIcon, label: 'Settings' },
]

interface SidebarProps {
  connection: string
  storeName: string
  storeLogoUrl: string | null
}

function statusColor(status: string) {
  switch (status) {
    case 'connected': return 'bg-emerald-400'
    case 'connecting': return 'bg-amber-400'
    default: return 'bg-red-400'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'connected': return 'Connected'
    case 'connecting': return 'Connecting'
    default: return 'Disconnected'
  }
}

export default function Sidebar({ connection, storeName, storeLogoUrl }: SidebarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const initial = storeName.charAt(0).toUpperCase()

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col bg-teal-800 lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-teal-700/50 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 ring-1 ring-white/10">
          <span className="text-sm font-bold tracking-tight text-white">W</span>
        </div>
        <div>
          <span className="text-lg font-semibold tracking-tight text-teal-50">WANI</span>
          <span className="ml-2 rounded bg-teal-700/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-teal-200">Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-teal-50'
                  : 'text-teal-200 hover:bg-white/5 hover:text-teal-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`shrink-0 ${isActive ? 'text-teal-50' : 'text-teal-300'}`}>
                  <item.icon />
                </span>
                <span>{item.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-teal-700/50 px-3 py-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 transition-all duration-200 hover:bg-white/5 hover:text-red-200"
        >
          <span className="shrink-0 text-red-300">
            <LogOutIcon />
          </span>
          <span>Logout</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className="border-t border-teal-700/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className={`block h-2 w-2 rounded-full ${statusColor(connection)}`} />
            <span className={`absolute inset-0 h-2 w-2 animate-ping rounded-full ${statusColor(connection)} opacity-40`} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-teal-200">WhatsApp</span>
            <span className="text-sm text-teal-50">{statusLabel(connection)}</span>
          </div>
        </div>
      </div>

      {/* Store Owner */}
      <div className="border-t border-teal-700/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-600 ring-2 ring-teal-500/40">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt={storeName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">{initial}</span>
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-teal-50">{storeName}</span>
            <span className="text-xs text-teal-300">Store Owner</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
