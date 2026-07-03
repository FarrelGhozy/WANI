import { Outlet } from 'react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx'
import Sidebar from '@/components/Sidebar.tsx'
import BottomNav from '@/components/BottomNav.tsx'
import Topbar from '@/components/Topbar.tsx'
import ToastContainer from '@/components/ui/Toast.tsx'
import { useToast } from '@/hooks/useToast.ts'
import { useWaStatusContext } from '@/contexts/WaStatusContext.tsx'
import { StoreProvider } from '@/contexts/StoreContext.tsx'
import { ProductsProvider } from '@/contexts/ProductsContext.tsx'

export default function Layout() {
  const { connection } = useWaStatusContext()
  const { toasts, removeToast } = useToast()

  return (
    <StoreProvider>
      <ProductsProvider>
        <LayoutInner connection={connection} toasts={toasts} removeToast={removeToast} />
      </ProductsProvider>
    </StoreProvider>
  )
}

function LayoutInner({ connection, toasts, removeToast }: {
  connection: string
  toasts: ReturnType<typeof useToast>['toasts']
  removeToast: ReturnType<typeof useToast>['removeToast']
}) {
  return (
    <div className="flex min-h-screen bg-stone-50">
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
