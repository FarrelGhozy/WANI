import { Outlet } from 'react-router'
import Sidebar from '@/components/Sidebar.tsx'
import BottomNav from '@/components/BottomNav.tsx'
import Topbar from '@/components/Topbar.tsx'
import ToastContainer from '@/components/ui/Toast.tsx'
import { useToast } from '@/hooks/useToast.ts'
import { useWaStatusContext } from '@/contexts/WaStatusContext.tsx'
import { useSettings } from '@/hooks/useSettings.ts'

export default function Layout() {
  const { connection } = useWaStatusContext()
  const { store } = useSettings()
  const { toasts, removeToast } = useToast()

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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
