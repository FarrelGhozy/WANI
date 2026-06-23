import { NavLink } from 'react-router'
import { GridIcon, BagIcon, ClipboardIcon, PeopleIcon, GlobeIcon, CogIcon } from './Icons.tsx'

const navItems = [
  { to: '/', icon: GridIcon, label: 'Dashboard' },
  { to: '/products', icon: BagIcon, label: 'Produk' },
  { to: '/orders', icon: ClipboardIcon, label: 'Pesanan' },
  { to: '/customers', icon: PeopleIcon, label: 'Pelanggan' },
  { to: '/website', icon: GlobeIcon, label: 'Website' },
  { to: '/settings', icon: CogIcon, label: 'Pengaturan' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex flex-col items-center gap-0.5 px-3 py-2"
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-teal-600' : 'text-stone-400'}>
                  <item.icon />
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? 'text-teal-700' : 'text-stone-400'
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
