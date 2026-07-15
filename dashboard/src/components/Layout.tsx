import { Outlet, useNavigation } from 'react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx'
import Sidebar from '@/components/Sidebar.tsx'
import BottomNav from '@/components/BottomNav.tsx'
import Topbar from '@/components/Topbar.tsx'
import ToastContainer from '@/components/ui/Toast.tsx'
import { useToast } from '@/hooks/useToast.ts'
import { useWaStatusContext } from '@/contexts/WaStatusContext.tsx'
import { StoreProvider } from '@/contexts/StoreContext.tsx'
import { ProductsProvider } from '@/contexts/ProductsContext.tsx'
import { TourProvider } from '@/contexts/TourContext.tsx'
import TourOverlay from '@/components/TourOverlay.tsx'

function NavProgress() {
  const navigation = useNavigation()
  if (navigation.state === 'idle') return null
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1">
      <div className="h-full animate-pulse bg-teal-500" />
    </div>
  )
}

export default function Layout() {
  const { connection } = useWaStatusContext()
  const { toasts, removeToast } = useToast()

  return (
    <TourProvider>
      <StoreProvider>
        <ProductsProvider>
          <LayoutInner connection={connection} toasts={toasts} removeToast={removeToast} />
          <TourOverlay />
        </ProductsProvider>
      </StoreProvider>
    </TourProvider>
  )
}

function LayoutInner({ connection, toasts, removeToast }: {
  connection: string
  toasts: ReturnType<typeof useToast>['toasts']
  removeToast: ReturnType<typeof useToast>['removeToast']
}) {
  return (
    <div className="flex min-h-screen bg-stone-50">
      <NavProgress />
      <Sidebar connection={connection} />
      <div className="flex flex-1 flex-col lg:ml-64">
        <Topbar connection={connection} />
        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
