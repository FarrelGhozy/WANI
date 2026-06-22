import { Outlet } from 'react-router'
import Sidebar from './Sidebar.tsx'
import Topbar from './Topbar.tsx'
import { useWaStatus } from '../hooks/useWaStatus.ts'

export default function Layout() {
  const { connection } = useWaStatus()

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar connection={connection} />
      <div className="ml-64 flex flex-1 flex-col">
        <Topbar connection={connection} />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
