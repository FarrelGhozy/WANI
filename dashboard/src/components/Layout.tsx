import { Outlet } from 'react-router'
import Sidebar from './Sidebar.tsx'
import BottomNav from './BottomNav.tsx'
import Topbar from './Topbar.tsx'
import { useWaStatus } from '../hooks/useWaStatus.ts'

export default function Layout() {
  const { connection } = useWaStatus()

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar connection={connection} />
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
