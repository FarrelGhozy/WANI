import { Outlet } from 'react-router'
import Sidebar from './Sidebar.tsx'
import BottomNav from './BottomNav.tsx'
import Topbar from './Topbar.tsx'
import { useWaStatus } from '../hooks/useWaStatus.ts'
import { useSettings } from '../hooks/useSettings.ts'

export default function Layout() {
  const { connection } = useWaStatus()
  const { store } = useSettings()

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar connection={connection} storeName={store?.businessName ?? 'WANI'} storeLogoUrl={store?.logoUrl ?? null} />
      <div className="flex flex-1 flex-col lg:ml-64">
        <Topbar connection={connection} />
        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
