import { NavLink } from 'react-router'
import { GridIcon, BagIcon, ClipboardIcon, PeopleIcon, GlobeIcon, CogIcon } from '@/components/Icons.tsx'

const navItems = [
  { to: '/', icon: GridIcon, label: 'Dashboard' },
  { to: '/products', icon: BagIcon, label: 'Produk' },
  { to: '/orders', icon: ClipboardIcon, label: 'Pesanan' },
  { to: '/customers', icon: PeopleIcon, label: 'Pelanggan' },
  { to: '/website', icon: GlobeIcon, label: 'Website' },
  { to: '/settings', icon: CogIcon, label: 'Lainnya' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-around border-t border-stone-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors min-w-0 flex-1 ${
              isActive
                ? 'text-teal-600'
                : 'text-stone-400 hover:text-stone-600'
            }`
          }
          aria-label={item.label}
        >
          {({ isActive }) => (
            <>
              <span className={isActive ? 'text-teal-500' : 'text-stone-400'}>
                <item.icon />
              </span>
              <span className="truncate">{item.label}</span>
              {isActive && <span className="h-0.5 w-4 rounded-full bg-teal-500" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
