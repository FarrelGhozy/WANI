import { useCustomers } from '../hooks/useCustomers.ts'
import CustomerListView from '../components/CustomerListView.tsx'
import ChatView from '../components/ChatView.tsx'
import Spinner from '../components/ui/Spinner.tsx'

function EmptyChatPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
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
  const { customers, loading, search, setSearch, selectedId, setSelectedId, selected, getConversation } = useCustomers()
  const conversation = selectedId ? getConversation(selectedId) : null

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Customers</h1>
        <p className="mt-1 text-sm text-stone-500">{customers.length} pelanggan</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="h-10 w-full max-w-md rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Two-panel */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left: Customer list */}
        <div className="w-80 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-stone-500">No customers found</p>
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
        <div className="flex flex-1 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {selected && conversation ? (
            <ChatView customerName={selected.name} conversation={conversation} />
          ) : (
            <EmptyChatPanel />
          )}
        </div>
      </div>
    </div>
  )
}
