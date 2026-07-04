import { useState, useMemo, useCallback, useEffect } from 'react'
import { fetchApi } from '@/lib/api'
import { getErrorMessage } from '@/hooks/useToast'
import type { MessageRole, ConversationStatus, Message, Conversation, Customer } from '@/types.ts'

export type { MessageRole, ConversationStatus, Message, Conversation, Customer }

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [convLoading, setConvLoading] = useState(false)

  const fetchCustomers = useCallback(async () => {
    const res = await fetchApi<{ items: Customer[]; total: number }>('/customers?limit=100')
    return res.data?.items ?? []
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const items = await fetchCustomers()
        if (!cancelled) setCustomers(items)
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, 'Gagal memuat pelanggan'))
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [fetchCustomers])

  // Auto-load conversation when selected customer changes
  useEffect(() => {
    let cancelled = false
    setConvLoading(true)
    ;(async () => {
      if (!selectedId) {
        if (!cancelled) setConversation(null)
        setConvLoading(false)
        return
      }
      try {
        const res = await fetchApi<{
          id: string
          phone: string
          name: string
          notes: string | null
          totalOrders: number
          orders: Array<{ id: string; status: string; totalAmount: number; createdAt: string }>
          conversation: {
            id: string
            status: string
            messages: Array<{
              id: string
              role: string
              content: string
              msgType: string
              waMsgId: string | null
              metadata: Record<string, unknown> | null
              createdAt: string
            }>
          } | null
          createdAt: string
          updatedAt: string
        }>(`/customers/${selectedId}`)
        if (!cancelled) {
          const conv = res.data?.conversation
          if (conv) {
            setConversation({
              id: conv.id,
              customerId: selectedId,
              status: conv.status as ConversationStatus,
              messages: conv.messages.map((m) => ({
                id: m.id,
                role: m.role as MessageRole,
                content: m.content,
                msgType: m.msgType,
                waMsgId: m.waMsgId,
                metadata: m.metadata,
                createdAt: m.createdAt,
              })),
            })
          } else {
            setConversation(null)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setConversation(null)
          setError(getErrorMessage(e, 'Gagal memuat percakapan'))
        }
      }
      if (!cancelled) setConvLoading(false)
    })()
    return () => { cancelled = true }
  }, [selectedId])

  const sendMessage = useCallback(async (text: string) => {
    if (!conversation || !selectedId) return
    try {
      const res = await fetchApi<{
        id: string
        role: string
        content: string
        createdAt: string
      }>(`/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.data) {
        const newMsg: Message = {
          id: res.data.id,
          role: res.data.role as MessageRole,
          content: res.data.content,
          msgType: 'text',
          waMsgId: null,
          metadata: null,
          createdAt: res.data.createdAt,
        }
        setConversation((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev)
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Gagal memuat pelanggan'))
    }
  }, [conversation, selectedId])

  const filtered = useMemo(() =>
    customers.filter((c) => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.phone.includes(q)
    }),
  [customers, search])

  const selected = useMemo(() =>
    customers.find((c) => c.id === selectedId) ?? null,
  [customers, selectedId])

  return {
    customers: filtered,
    allCustomers: customers,
    loading,
    error,
    search, setSearch,
    selectedId, setSelectedId,
    selected,
    conversation,
    convLoading,
    sendMessage,
    reload: useCallback(async () => {
      setLoading(true)
      setError(null)
      try {
        const items = await fetchCustomers()
        setCustomers(items)
      } catch (e) {
        setError(getErrorMessage(e, 'Gagal memuat pelanggan'))
      } finally {
        setLoading(false)
      }
    }, [fetchCustomers]),
  }
}
