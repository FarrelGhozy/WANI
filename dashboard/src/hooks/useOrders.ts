import { useState, useMemo, useCallback, useEffect } from 'react'
import { fetchApi } from '@/lib/api.ts'
import { getErrorMessage } from '@/hooks/useToast.ts'
import type { OrderStatus, OrderSortField, OrderItem, Payment, Order } from '@/types.ts'
export type { OrderStatus, OrderSortField, OrderItem, Payment, Order }

interface ApiOrder {
  id: string
  customerId: string
  customer: { id: string; name: string; phone: string }
  status: string
  totalAmount: number
  source: string
  notes: string | null
  items: Array<{
    id: string
    productId: string
    product: { id: string; name: string }
    qty: number
    unitPrice: number
    subtotal: number
  }>
  payment: { method: string | null; amount: number; status: string; paidAt: string | null } | null
  createdAt: string
  updatedAt: string
}

function mapOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    customerId: o.customerId,
    customerName: o.customer.name,
    customerPhone: o.customer.phone,
    status: o.status as OrderStatus,
    totalAmount: o.totalAmount,
    source: o.source,
    notes: o.notes,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    payment: o.payment,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export { formatPrice } from '@/utils/format.ts'

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState<OrderSortField>('status')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const fetchOrders = useCallback(async () => {
    const res = await fetchApi<{ items: ApiOrder[]; total: number }>('/orders?limit=500')
    return res.data?.items.map(mapOrder) ?? []
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const items = await fetchOrders()
        if (!cancelled) setOrders(items)
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, 'Gagal memuat pesanan'))
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [fetchOrders])

  const filtered = useMemo(() => {
    const result = orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!o.customerName.toLowerCase().includes(q) && !o.id.toLowerCase().includes(q)) return false
      }
      return true
    })

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'id':
          cmp = a.id.localeCompare(b.id)
          break
        case 'customerName':
          cmp = a.customerName.localeCompare(b.customerName)
          break
        case 'items':
          cmp = a.items.length - b.items.length
          break
        case 'totalAmount':
          cmp = a.totalAmount - b.totalAmount
          break
        case 'status': {
          const priority: Record<string, number> = { PENDING: 0, CONFIRMED: 1, PROCESSING: 2, COMPLETED: 3, CANCELLED: 4 }
          cmp = (priority[a.status] ?? 99) - (priority[b.status] ?? 99)
          break
        }
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [orders, search, statusFilter, sortField, sortDir])

  const toggleSort = useCallback((field: OrderSortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }, [sortField])

  const getOrder = useCallback((id: string): Order | undefined =>
    orders.find((o) => o.id === id),
  [orders])

  const updateStatus = useCallback(async (id: string, status: OrderStatus): Promise<Order | undefined> => {
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return undefined
    const allowed = statusFlow[orders[idx].status]
    if (!allowed.includes(status)) return undefined
    try {
      const res = await fetchApi<ApiOrder>(`/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.data) {
        const mapped = mapOrder(res.data)
        setOrders((prev) => prev.map((o) => o.id === id ? mapped : o))
        return mapped
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Gagal memperbarui status'))
      throw e
    }
  }, [orders])

  const nextStatuses = useCallback((id: string): OrderStatus[] => {
    const order = orders.find((o) => o.id === id)
    return order ? statusFlow[order.status] : []
  }, [orders])

  const confirmPayment = useCallback(async (
    id: string,
    data: { method: string; amount: number },
  ): Promise<Order | undefined> => {
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return undefined
    try {
      const res = await fetchApi<ApiOrder>(`/orders/${id}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: data.method,
          amount: data.amount,
          status: 'PAID',
          paidAt: new Date().toISOString(),
        }),
      })
      if (res.data) {
        const mapped = mapOrder(res.data)
        setOrders((prev) => prev.map((o) => o.id === id ? mapped : o))
        return mapped
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Gagal konfirmasi pembayaran'))
      throw e
    }
  }, [orders])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await fetchOrders()
      setOrders(items)
    } catch (e) {
      setError(getErrorMessage(e, 'Gagal memuat pesanan'))
    } finally {
      setLoading(false)
    }
  }, [fetchOrders])

  return {
    orders: filtered,
    allOrders: orders,
    loading,
    error,
    search, setSearch,
    statusFilter, setStatusFilter,
    sortField, sortDir, toggleSort,
    getOrder, updateStatus, nextStatuses,
    confirmPayment,
    reload,
  }
}
