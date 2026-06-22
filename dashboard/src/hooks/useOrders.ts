import { useState, useMemo, useCallback } from 'react'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  qty: number
  unitPrice: number
  subtotal: number
}

export interface Payment {
  method: string | null
  amount: number
  status: string
  paidAt: string | null
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  status: OrderStatus
  totalAmount: number
  source: string
  notes: string | null
  items: OrderItem[]
  payment: Payment | null
  createdAt: string
  updatedAt: string
}

const MOCK = true

function addMin(time: string, min: number): string {
  const d = new Date(time)
  d.setMinutes(d.getMinutes() + min)
  return d.toISOString()
}

const mockOrders: Order[] = [
  {
    id: 'ord-1', customerId: 'c1', customerName: 'Budi Santoso', customerPhone: '+628121112223',
    status: 'COMPLETED', totalAmount: 55000, source: 'wa_chat', notes: null,
    items: [
      { id: 'oi-1', productId: 'p1', productName: 'Nasi Goreng Spesial', qty: 2, unitPrice: 25000, subtotal: 50000 },
      { id: 'oi-2', productId: 'p4', productName: 'Es Teh Manis', qty: 1, unitPrice: 5000, subtotal: 5000 },
    ],
    payment: { method: 'QRIS', amount: 55000, status: 'PAID', paidAt: addMin('2026-06-20T10:32:00Z', 0) },
    createdAt: '2026-06-20T10:30:00Z', updatedAt: '2026-06-20T11:00:00Z',
  },
  {
    id: 'ord-2', customerId: 'c2', customerName: 'Ani Wijaya', customerPhone: '+628123334445',
    status: 'PROCESSING', totalAmount: 25000, source: 'wa_chat', notes: 'Tambahkan saus sambal',
    items: [
      { id: 'oi-3', productId: 'p3', productName: 'Ayam Geprek', qty: 1, unitPrice: 22000, subtotal: 22000 },
      { id: 'oi-4', productId: 'p9', productName: 'Kerupuk Aneka Rasa', qty: 1, unitPrice: 3000, subtotal: 3000 },
    ],
    payment: { method: 'TRANSFER', amount: 25000, status: 'PAID', paidAt: addMin('2026-06-20T14:35:00Z', 0) },
    createdAt: '2026-06-20T14:30:00Z', updatedAt: '2026-06-20T14:50:00Z',
  },
  {
    id: 'ord-3', customerId: 'c1', customerName: 'Budi Santoso', customerPhone: '+628121112223',
    status: 'PENDING', totalAmount: 40000, source: 'wa_chat', notes: null,
    items: [
      { id: 'oi-5', productId: 'p5', productName: 'Kopi Susu Gula Aren', qty: 2, unitPrice: 18000, subtotal: 36000 },
      { id: 'oi-6', productId: 'p7', productName: 'Pisang Goreng', qty: 1, unitPrice: 4000, subtotal: 4000 },
    ],
    payment: null,
    createdAt: '2026-06-21T08:15:00Z', updatedAt: '2026-06-21T08:15:00Z',
  },
  {
    id: 'ord-4', customerId: 'c3', customerName: 'Siti Rahma', customerPhone: '+628125556667',
    status: 'CONFIRMED', totalAmount: 30000, source: 'wa_chat', notes: 'Antar ke rumah',
    items: [
      { id: 'oi-7', productId: 'p2', productName: 'Mie Ayam Bakso', qty: 1, unitPrice: 20000, subtotal: 20000 },
      { id: 'oi-8', productId: 'p8', productName: 'Singkong Keju', qty: 1, unitPrice: 10000, subtotal: 10000 },
    ],
    payment: { method: 'CASH', amount: 30000, status: 'PAID', paidAt: addMin('2026-06-21T09:05:00Z', 0) },
    createdAt: '2026-06-21T09:00:00Z', updatedAt: '2026-06-21T09:05:00Z',
  },
  {
    id: 'ord-5', customerId: 'c4', customerName: 'Dedi Kurniawan', customerPhone: '+628127778889',
    status: 'CANCELLED', totalAmount: 0, source: 'wa_chat', notes: 'Pesanan dibatalkan pelanggan',
    items: [
      { id: 'oi-9', productId: 'p1', productName: 'Nasi Goreng Spesial', qty: 1, unitPrice: 25000, subtotal: 25000 },
    ],
    payment: null,
    createdAt: '2026-06-19T16:00:00Z', updatedAt: '2026-06-19T16:20:00Z',
  },
  {
    id: 'ord-6', customerId: 'c5', customerName: 'Maya Putri', customerPhone: '+628129990001',
    status: 'PENDING', totalAmount: 18000, source: 'wa_chat', notes: null,
    items: [
      { id: 'oi-10', productId: 'p5', productName: 'Kopi Susu Gula Aren', qty: 1, unitPrice: 18000, subtotal: 18000 },
    ],
    payment: null,
    createdAt: '2026-06-21T10:45:00Z', updatedAt: '2026-06-21T10:45:00Z',
  },
  {
    id: 'ord-7', customerId: 'c2', customerName: 'Ani Wijaya', customerPhone: '+628123334445',
    status: 'COMPLETED', totalAmount: 47000, source: 'wa_chat', notes: null,
    items: [
      { id: 'oi-11', productId: 'p1', productName: 'Nasi Goreng Spesial', qty: 1, unitPrice: 25000, subtotal: 25000 },
      { id: 'oi-12', productId: 'p4', productName: 'Es Teh Manis', qty: 2, unitPrice: 5000, subtotal: 10000 },
      { id: 'oi-13', productId: 'p7', productName: 'Pisang Goreng', qty: 2, unitPrice: 6000, subtotal: 12000 },
    ],
    payment: { method: 'QRIS', amount: 47000, status: 'PAID', paidAt: addMin('2026-06-18T18:33:00Z', 0) },
    createdAt: '2026-06-18T18:30:00Z', updatedAt: '2026-06-18T19:00:00Z',
  },
  {
    id: 'ord-8', customerId: 'c6', customerName: 'Rudi Haryanto', customerPhone: '+628120002223',
    status: 'PROCESSING', totalAmount: 35000, source: 'wa_chat', notes: 'Jangan pakai micin',
    items: [
      { id: 'oi-14', productId: 'p3', productName: 'Ayam Geprek', qty: 1, unitPrice: 22000, subtotal: 22000 },
      { id: 'oi-15', productId: 'p4', productName: 'Es Teh Manis', qty: 1, unitPrice: 5000, subtotal: 5000 },
      { id: 'oi-16', productId: 'p9', productName: 'Kerupuk Aneka Rasa', qty: 1, unitPrice: 8000, subtotal: 8000 },
    ],
    payment: { method: 'TRANSFER', amount: 35000, status: 'PAID', paidAt: addMin('2026-06-21T11:05:00Z', 0) },
    createdAt: '2026-06-21T11:00:00Z', updatedAt: '2026-06-21T11:20:00Z',
  },
]

const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export function formatPrice(price: number) {
  return `Rp${price.toLocaleString('id-ID')}`
}

export function useOrders() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [orders, setOrders] = useState(MOCK ? [...mockOrders] : [])

  const filtered = useMemo(() =>
    orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!o.customerName.toLowerCase().includes(q) && !o.id.toLowerCase().includes(q)) return false
      }
      return true
    }),
  [orders, search, statusFilter])

  const getOrder = useCallback((id: string): Order | undefined =>
    orders.find((o) => o.id === id),
  [orders])

  const updateStatus = useCallback((id: string, status: OrderStatus): Order | undefined => {
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return undefined
    const allowed = statusFlow[orders[idx].status]
    if (!allowed.includes(status)) return undefined
    const updated: Order = { ...orders[idx], status, updatedAt: new Date().toISOString() }
    const newOrders = [...orders]
    newOrders[idx] = updated
    setOrders(newOrders)
    return updated
  }, [orders])

  const nextStatuses = useCallback((id: string): OrderStatus[] => {
    const order = orders.find((o) => o.id === id)
    return order ? statusFlow[order.status] : []
  }, [orders])

  return {
    orders: filtered,
    allOrders: orders,
    loading: false,
    search, setSearch,
    statusFilter, setStatusFilter,
    getOrder, updateStatus, nextStatuses,
  }
}
