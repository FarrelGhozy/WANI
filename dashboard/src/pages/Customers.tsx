import { useCustomers } from '@/hooks/useCustomers.ts'
import CustomerListView from '@/components/CustomerListView.tsx'
import ChatView from '@/components/ChatView.tsx'
import Input from '@/components/ui/Input.tsx'
import Spinner from '@/components/ui/Spinner.tsx'

function EmptyChatPanel() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-stone-100 p-5 text-stone-300">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-stone-900">Pilih Customer</h3>
      <p className="mt-1 max-w-xs text-xs text-stone-500">
        Klik customer di sebelah kiri untuk melihat percakapan dan riwayat pesanan
      </p>
    </div>
  )
}

export default function Customers() {
  const { customers, loading, search, setSearch, selectedId, setSelectedId, selected, conversation, sendMessage, convLoading } = useCustomers()

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-16 lg:pb-0">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Pelanggan</h1>
        <p className="mt-1 text-sm text-stone-500">{customers.length} pelanggan</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau telepon..."
          className="max-w-md"
          prefix={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          }
        />
      </div>

      {/* Two-panel */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left: Customer list */}
        <div className={`overflow-hidden rounded-xl border border-stone-200 bg-white ${selectedId ? 'hidden lg:flex lg:w-80' : 'flex-1 lg:w-80 lg:shrink-0'}`}>
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-stone-500">Tidak ada pelanggan</p>
            </div>
          ) : (
            <CustomerListView
              customers={customers}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        {/* Right: Chat + Detail */}
        <div className={`relative overflow-hidden rounded-xl border border-stone-200 bg-white ${!selectedId ? 'hidden lg:block lg:flex-1' : 'flex-1'}`}>
          {selected && conversation ? (
            <ChatView
              customerName={selected.name}
              conversation={conversation}
              onBack={() => setSelectedId(null)}
              onSendMessage={sendMessage}
              sending={convLoading}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {selectedId && convLoading ? (
                <Spinner size={24} />
              ) : (
                <EmptyChatPanel />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
