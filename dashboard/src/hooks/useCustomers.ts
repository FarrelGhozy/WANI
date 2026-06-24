import { useState, useMemo, useCallback, useEffect } from 'react'
import { fetchApi } from '../lib/api'

export type MessageRole = 'CUSTOMER' | 'BOT' | 'HUMAN'
export type ConversationStatus = 'ACTIVE' | 'RESOLVED' | 'ARCHIVED' | 'ESCALATED'

export interface Message {
  id: string
  role: MessageRole
  content: string
  msgType: string
  waMsgId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface Conversation {
  id: string
  customerId: string
  status: ConversationStatus
  messages: Message[]
}

export interface Customer {
  id: string
  phone: string
  name: string
  notes: string | null
  totalOrders: number
  unreadCount: number
  lastMessage: Pick<Message, 'content' | 'role' | 'createdAt'> | null
  recentOrder: { id: string; status: string; totalAmount: number; createdAt: string } | null
  createdAt: string
  updatedAt: string
}

interface ApiCustomer extends Customer {} // API matches Customer interface

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [convLoading, setConvLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchApi<{ items: ApiCustomer[]; total: number }>('/api/customers?limit=100')
      setCustomers(res.data?.items ?? [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const fetchConversation = useCallback(async (customerId: string) => {
    setConvLoading(true)
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
      }>(`/api/customers/${customerId}`)

      const conv = res.data?.conversation
      if (conv) {
        setConversation({
          id: conv.id,
          customerId,
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
    } catch {
      setConversation(null)
    } finally {
      setConvLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!conversation || !selectedId) return
    try {
      const res = await fetchApi<{
        id: string
        role: string
        content: string
        createdAt: string
      }>(`/api/conversations/${conversation.id}/messages`, {
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
      setError((e as Error).message)
    }
  }, [conversation, selectedId])

  // Auto-load conversation when selected customer changes
  useEffect(() => {
    if (selectedId) {
      fetchConversation(selectedId)
    } else {
      setConversation(null)
    }
  }, [selectedId, fetchConversation])

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
    reload: load,
  }
}
