import type { Customer, MessageRole } from '@/hooks/useCustomers.ts'
import { formatDate } from '@/utils/format'

interface CustomerListViewProps {
  customers: Customer[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const roleLabel: Record<MessageRole, string> = {
  CUSTOMER: 'Customer',
  BOT: 'Bot',
  HUMAN: 'Anda',
}

export default function CustomerListView({ customers, selectedId, onSelect }: CustomerListViewProps) {
  if (customers.length === 0) return null

  return (
    <div className="divide-y divide-stone-100 overflow-y-auto">
      {customers.map((customer) => {
        const isSelected = customer.id === selectedId
        return (
          <button
            key={customer.id}
            onClick={() => onSelect(customer.id)}
            className={`w-full px-4 py-3.5 text-left transition-colors hover:bg-stone-50 ${
              isSelected ? 'bg-teal-50/50 ring-1 ring-inset ring-teal-200' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                  {customer.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm ${isSelected ? 'font-semibold text-teal-800' : 'font-medium text-stone-900'}`}>
                      {customer.name}
                    </p>
                    {customer.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                        {customer.unreadCount}
                      </span>
                    )}
                  </div>
                  {customer.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      <span className="text-stone-400">{roleLabel[customer.lastMessage.role]}: </span>
                      {customer.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>

              {/* Time + status */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="whitespace-nowrap text-[11px] text-stone-400">
                  {customer.lastMessage
                    ? formatDate(customer.lastMessage.createdAt, { timeOnly: true })
                    : ''}
                </span>
                {customer.totalOrders > 0 && (
                  <span className="text-[11px] text-stone-400">{customer.totalOrders} pesanan</span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
