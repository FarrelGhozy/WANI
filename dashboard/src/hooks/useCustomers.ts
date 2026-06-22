import { useState, useMemo, useCallback } from 'react'

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

const MOCK = true

function minAgo(min: number): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - min)
  return d.toISOString()
}

const mockCustomers: Customer[] = [
  {
    id: 'c1', phone: '+628121112223', name: 'Budi Santoso', notes: 'Pelanggan tetap, suka nasi goreng',
    totalOrders: 2, unreadCount: 0,
    lastMessage: { content: 'Makasih kak, enak banget nasgor nya!', role: 'CUSTOMER', createdAt: minAgo(180) },
    recentOrder: { id: 'ord-3', status: 'PENDING', totalAmount: 40000, createdAt: '2026-06-21T08:15:00Z' },
    createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-06-21T08:15:00Z',
  },
  {
    id: 'c2', phone: '+628123334445', name: 'Ani Wijaya', notes: null,
    totalOrders: 2, unreadCount: 2,
    lastMessage: { content: 'Kak, pesanan saya sudah diproses belum?', role: 'CUSTOMER', createdAt: minAgo(15) },
    recentOrder: { id: 'ord-2', status: 'PROCESSING', totalAmount: 25000, createdAt: '2026-06-20T14:30:00Z' },
    createdAt: '2026-05-15T00:00:00Z', updatedAt: '2026-06-20T14:50:00Z',
  },
  {
    id: 'c3', phone: '+628125556667', name: 'Siti Rahma', notes: 'Minta anter ke rumah, dekat pasar',
    totalOrders: 1, unreadCount: 1,
    lastMessage: { content: 'Iya kak, nanti saya tunggu ya', role: 'CUSTOMER', createdAt: minAgo(120) },
    recentOrder: { id: 'ord-4', status: 'CONFIRMED', totalAmount: 30000, createdAt: '2026-06-21T09:00:00Z' },
    createdAt: '2026-05-20T00:00:00Z', updatedAt: '2026-06-21T09:05:00Z',
  },
  {
    id: 'c4', phone: '+628127778889', name: 'Dedi Kurniawan', notes: null,
    totalOrders: 1, unreadCount: 0,
    lastMessage: { content: 'Maaf kak, pesanan saya dibatalkan aja', role: 'CUSTOMER', createdAt: minAgo(1440) },
    recentOrder: { id: 'ord-5', status: 'CANCELLED', totalAmount: 0, createdAt: '2026-06-19T16:00:00Z' },
    createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-19T16:20:00Z',
  },
  {
    id: 'c5', phone: '+628129990001', name: 'Maya Putri', notes: 'Baru pertama order',
    totalOrders: 1, unreadCount: 1,
    lastMessage: { content: 'Kak, kopi susunya bisa kurang manis?', role: 'CUSTOMER', createdAt: minAgo(30) },
    recentOrder: { id: 'ord-6', status: 'PENDING', totalAmount: 18000, createdAt: '2026-06-21T10:45:00Z' },
    createdAt: '2026-06-21T10:00:00Z', updatedAt: '2026-06-21T10:45:00Z',
  },
  {
    id: 'c6', phone: '+628120002223', name: 'Rudi Haryanto', notes: null,
    totalOrders: 1, unreadCount: 0,
    lastMessage: { content: 'Ok kak, makasih', role: 'CUSTOMER', createdAt: minAgo(60) },
    recentOrder: { id: 'ord-8', status: 'PROCESSING', totalAmount: 35000, createdAt: '2026-06-21T11:00:00Z' },
    createdAt: '2026-06-10T00:00:00Z', updatedAt: '2026-06-21T11:20:00Z',
  },
  {
    id: 'c7', phone: '+628134445556', name: 'Fitri Handayani', notes: null,
    totalOrders: 0, unreadCount: 0,
    lastMessage: null,
    recentOrder: null,
    createdAt: '2026-06-22T00:00:00Z', updatedAt: '2026-06-22T00:00:00Z',
  },
]

const mockConversations: Record<string, Conversation> = {
  c1: {
    id: 'conv-1', customerId: 'c1', status: 'RESOLVED',
    messages: [
      { id: 'msg-1', role: 'CUSTOMER', content: 'Halo kak, mau pesan nasi goreng 2 porsi', msgType: 'text', waMsgId: 'wa1', metadata: null, createdAt: minAgo(480) },
      { id: 'msg-2', role: 'BOT', content: 'Halo Budi! Terima kasih sudah menghubungi WANI Kitchen 😊\n\nNasi Goreng Spesial 2 porsi = Rp50.000\n\nKonfirmasi pemesanan?', msgType: 'text', waMsgId: 'wa2', metadata: null, createdAt: minAgo(479) },
      { id: 'msg-3', role: 'CUSTOMER', content: 'Iya kak, plus es teh manis 1', msgType: 'text', waMsgId: 'wa3', metadata: null, createdAt: minAgo(478) },
      { id: 'msg-4', role: 'BOT', content: 'Baik, total Rp55.000\nPembayaran via QRIS ya?', msgType: 'text', waMsgId: 'wa4', metadata: null, createdAt: minAgo(477) },
      { id: 'msg-5', role: 'CUSTOMER', content: 'Siap, udah bayar', msgType: 'text', waMsgId: 'wa5', metadata: null, createdAt: minAgo(475) },
      { id: 'msg-6', role: 'BOT', content: 'Pembayaran diterima! Pesanan akan segera diproses 👍', msgType: 'text', waMsgId: 'wa6', metadata: null, createdAt: minAgo(474) },
      { id: 'msg-7', role: 'CUSTOMER', content: 'Makasih kak, enak banget nasgor nya!', msgType: 'text', waMsgId: 'wa7', metadata: null, createdAt: minAgo(180) },
      { id: 'msg-8', role: 'BOT', content: 'Senang mendengarnya! Jangan lupa order lagi ya 😊', msgType: 'text', waMsgId: 'wa8', metadata: null, createdAt: minAgo(179) },
    ],
  },
  c2: {
    id: 'conv-2', customerId: 'c2', status: 'ACTIVE',
    messages: [
      { id: 'msg-9', role: 'CUSTOMER', content: 'Kak, mau ayam geprek 1', msgType: 'text', waMsgId: 'wa9', metadata: null, createdAt: minAgo(240) },
      { id: 'msg-10', role: 'BOT', content: 'Halo Ani! Ayam Geprek 1 porsi = Rp22.000. Mau tambah minum atau lauk lain?', msgType: 'text', waMsgId: 'wa10', metadata: null, createdAt: minAgo(239) },
      { id: 'msg-11', role: 'CUSTOMER', content: 'Tambah kerupuk 1', msgType: 'text', waMsgId: 'wa11', metadata: null, createdAt: minAgo(238) },
      { id: 'msg-12', role: 'BOT', content: 'Total Rp25.000. Pembayaran via transfer ya?', msgType: 'text', waMsgId: 'wa12', metadata: null, createdAt: minAgo(237) },
      { id: 'msg-13', role: 'CUSTOMER', content: 'Udah transfer', msgType: 'text', waMsgId: 'wa13', metadata: null, createdAt: minAgo(235) },
      { id: 'msg-14', role: 'BOT', content: 'Pembayaran diterima! Pesanan diproses ya 🔥', msgType: 'text', waMsgId: 'wa14', metadata: null, createdAt: minAgo(234) },
      { id: 'msg-15', role: 'CUSTOMER', content: 'Kak, pesanan saya sudah diproses belum?', msgType: 'text', waMsgId: 'wa15', metadata: null, createdAt: minAgo(15) },
    ],
  },
  c3: {
    id: 'conv-3', customerId: 'c3', status: 'ACTIVE',
    messages: [
      { id: 'msg-16', role: 'CUSTOMER', content: 'Halo, mau mie ayam bakso 1', msgType: 'text', waMsgId: 'wa16', metadata: null, createdAt: minAgo(180) },
      { id: 'msg-17', role: 'BOT', content: 'Halo Siti! Mie Ayam Bakso 1 = Rp20.000. Mau tambah apa lagi?', msgType: 'text', waMsgId: 'wa17', metadata: null, createdAt: minAgo(179) },
      { id: 'msg-18', role: 'CUSTOMER', content: 'Singkong keju 1, bayar cash anter ke rumah ya', msgType: 'text', waMsgId: 'wa18', metadata: null, createdAt: minAgo(178) },
      { id: 'msg-19', role: 'BOT', content: 'Total Rp30.000. Alamatnya masih sama ya?', msgType: 'text', waMsgId: 'wa19', metadata: null, createdAt: minAgo(177) },
      { id: 'msg-20', role: 'CUSTOMER', content: 'Iya kak, nanti saya tunggu ya', msgType: 'text', waMsgId: 'wa20', metadata: null, createdAt: minAgo(120) },
      { id: 'msg-21', role: 'BOT', content: 'Siap, kurir akan segera menuju lokasi 🚗', msgType: 'text', waMsgId: 'wa21', metadata: null, createdAt: minAgo(119) },
    ],
  },
  c4: {
    id: 'conv-4', customerId: 'c4', status: 'RESOLVED',
    messages: [
      { id: 'msg-22', role: 'CUSTOMER', content: 'Mau nasi goreng 1 kak', msgType: 'text', waMsgId: 'wa22', metadata: null, createdAt: minAgo(1500) },
      { id: 'msg-23', role: 'BOT', content: 'Nasi Goreng Spesial 1 = Rp25.000. Konfirmasi?', msgType: 'text', waMsgId: 'wa23', metadata: null, createdAt: minAgo(1499) },
      { id: 'msg-24', role: 'CUSTOMER', content: 'Maaf kak, pesanan saya dibatalkan aja', msgType: 'text', waMsgId: 'wa24', metadata: null, createdAt: minAgo(1440) },
      { id: 'msg-25', role: 'BOT', content: 'Baik, pesanan dibatalkan. Sampai jumpa lain kali!', msgType: 'text', waMsgId: 'wa25', metadata: null, createdAt: minAgo(1439) },
    ],
  },
  c5: {
    id: 'conv-5', customerId: 'c5', status: 'ACTIVE',
    messages: [
      { id: 'msg-26', role: 'CUSTOMER', content: 'Halo, baru pertama mau order kopi susu 1', msgType: 'text', waMsgId: 'wa26', metadata: null, createdAt: minAgo(60) },
      { id: 'msg-27', role: 'BOT', content: 'Halo Maya! Selamat datang di WANI Kitchen 🎉\n\nKopi Susu Gula Aren 1 = Rp18.000\n\nAda yang ditanya?', msgType: 'text', waMsgId: 'wa27', metadata: null, createdAt: minAgo(59) },
      { id: 'msg-28', role: 'CUSTOMER', content: 'Kak, kopi susunya bisa kurang manis?', msgType: 'text', waMsgId: 'wa28', metadata: null, createdAt: minAgo(30) },
    ],
  },
  c6: {
    id: 'conv-6', customerId: 'c6', status: 'ACTIVE',
    messages: [
      { id: 'msg-29', role: 'CUSTOMER', content: 'Mau ayam geprek 1, es teh 1, kerupuk 1', msgType: 'text', waMsgId: 'wa29', metadata: null, createdAt: minAgo(120) },
      { id: 'msg-30', role: 'BOT', content: 'Halo Rudi! Pesanan:\n• Ayam Geprek 1 = Rp22.000\n• Es Teh Manis 1 = Rp5.000\n• Kerupuk Aneka Rasa 1 = Rp8.000\nTotal Rp35.000', msgType: 'text', waMsgId: 'wa30', metadata: null, createdAt: minAgo(119) },
      { id: 'msg-31', role: 'CUSTOMER', content: 'Jangan pakai micin ya', msgType: 'text', waMsgId: 'wa31', metadata: null, createdAt: minAgo(118) },
      { id: 'msg-32', role: 'BOT', content: 'Siap, dicatat! Pembayaran via transfer ya?', msgType: 'text', waMsgId: 'wa32', metadata: null, createdAt: minAgo(117) },
      { id: 'msg-33', role: 'CUSTOMER', content: 'Ok kak, makasih', msgType: 'text', waMsgId: 'wa33', metadata: null, createdAt: minAgo(60) },
    ],
  },
}

export function useCustomers() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [customers] = useState(MOCK ? [...mockCustomers] : [])

  const filtered = useMemo(() =>
    customers.filter((c) => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.phone.includes(q)
    }),
  [customers, search])

  const getConversation = useCallback((customerId: string): Conversation | null => {
    if (!MOCK) return null
    return mockConversations[customerId] ?? null
  }, [])

  const selected = useMemo(() =>
    customers.find((c) => c.id === selectedId) ?? null,
  [customers, selectedId])

  return {
    customers: filtered,
    allCustomers: customers,
    loading: false,
    search, setSearch,
    selectedId, setSelectedId,
    selected,
    getConversation,
  }
}
