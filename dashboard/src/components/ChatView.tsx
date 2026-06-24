import { useState, useRef, useEffect } from 'react'
import type { Conversation, Message } from '../hooks/useCustomers.ts'
import Badge from './ui/Badge.tsx'

interface ChatViewProps {
  customerName: string
  conversation: Conversation
  onBack?: () => void
  onSendMessage?: (text: string) => void
  sending?: boolean
}

const roleLabel: Record<string, string> = {
  CUSTOMER: '',
  BOT: '🤖 Bot',
  HUMAN: '👤 Anda',
}

const roleBg: Record<string, string> = {
  CUSTOMER: 'bg-stone-100 text-stone-900',
  BOT: 'bg-teal-50 text-teal-900',
  HUMAN: 'bg-amber-50 text-amber-900',
}

function ChatBubble({ message }: { message: Message }) {
  const time = new Date(message.createdAt).toLocaleDateString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={`flex flex-col ${message.role === 'CUSTOMER' ? 'items-start' : 'items-end'}`}>
      {message.role !== 'CUSTOMER' && (
        <span className="mb-1 text-[11px] text-stone-400">{roleLabel[message.role]}</span>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${roleBg[message.role]}`}>
        <p>{message.content}</p>
      </div>
      <span className="mt-0.5 px-1 text-[11px] text-stone-400">{time}</span>
    </div>
  )
}

const statusVariant: Record<string, 'teal' | 'green' | 'amber' | 'gray'> = {
  ACTIVE: 'teal',
  RESOLVED: 'green',
  ARCHIVED: 'gray',
  ESCALATED: 'amber',
}

export default function ChatView({ customerName, conversation, onBack, onSendMessage, sending }: ChatViewProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages])

  function handleSend() {
    if (!input.trim() || !onSendMessage) return
    onSendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="lg:hidden -ml-1 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <p className="text-sm font-semibold text-stone-900">{customerName}</p>
            <Badge variant={statusVariant[conversation.status]} dot>
              {conversation.status}
            </Badge>
          </div>
        </div>
        <span className="text-xs text-stone-400">{conversation.messages.length} pesan</span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 pb-20 lg:pb-4">
        {conversation.messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 px-4 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Balas ${customerName}...`}
            className="h-10 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
