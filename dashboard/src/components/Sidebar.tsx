import { NavLink } from 'react-router'
import { GridIcon, BoxIcon, ClipboardIcon, PeopleIcon, CogIcon } from './Icons.tsx'

const navItems = [
  { to: '/', icon: GridIcon, label: 'Dashboard' },
  { to: '/products', icon: BoxIcon, label: 'Products' },
  { to: '/orders', icon: ClipboardIcon, label: 'Orders' },
  { to: '/customers', icon: PeopleIcon, label: 'Customers' },
  { to: '/settings', icon: CogIcon, label: 'Settings' },
]

interface SidebarProps {
  connection: string
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

export default function Sidebar({ connection }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-teal-800">
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
    </aside>
  )
}
