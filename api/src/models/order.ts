import { prisma } from "@/src/config/db"
import type { Prisma } from "@db/client"

export interface CreateItemInput {
  productId: string
  productName: string
  unitPrice: number
  qty: number
}

export type OrderResponse = {
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
  payment: {
    method: string | null
    amount: number
    status: string
    paidAt: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export type OrderListResult = {
  items: OrderResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const orderInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  items: {
    include: { product: { select: { id: true, name: true } } },
  },
  payment: true,
} satisfies Prisma.OrderInclude

function toOrderResponse(row: any): OrderResponse {
  return {
    id: row.id,
    customerId: row.customerId,
    customer: row.customer,
    status: row.status,
    totalAmount: Number(row.totalAmount),
    source: row.source,
    notes: row.notes ?? null,
    items: (row.items ?? []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      product: i.product,
      qty: i.qty,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal),
    })),
    payment: row.payment
      ? {
          method: row.payment.method,
          amount: Number(row.payment.amount),
          status: row.payment.status,
          paidAt: row.payment.paidAt?.toISOString() ?? null,
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

export class OrderModel {
  static async createFromItems(
    customerId: string,
    items: CreateItemInput[],
    notes?: string,
  ): Promise<{ order: any; orderItems: any[] }> {
    const orderId = crypto.randomUUID()
    const orderItems = items.map((item) => ({
      id: crypto.randomUUID(),
      orderId,
      productId: item.productId,
      qty: item.qty,
      unitPrice: item.unitPrice,
      subtotal: item.unitPrice * item.qty,
    }))

    const totalAmount = orderItems.reduce((sum, oi) => sum + oi.subtotal, 0)

    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          id: orderId,
          customerId,
          totalAmount,
          notes: notes ?? null,
          source: "wa_chat",
        },
      })

      for (const oi of orderItems) {
        await tx.orderItem.create({ data: oi })
      }

      return o
    })

    return { order, orderItems }
  }

  static async list(params: {
    page: number
    limit: number
    status?: string
    customerId?: string
    dateFrom?: string
    dateTo?: string
    sort: string
    order: string
  }): Promise<OrderListResult> {
    const where: Record<string, unknown> = {}

    if (params.status) {
      where.status = params.status
    }
    if (params.customerId) {
      where.customerId = params.customerId
    }
    if (params.dateFrom || params.dateTo) {
      const createdAt: Record<string, string> = {}
      if (params.dateFrom) createdAt.gte = params.dateFrom
      if (params.dateTo) createdAt.lte = params.dateTo
      where.createdAt = createdAt
    }

    const skip = (params.page - 1) * params.limit

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where: where as any,
        include: orderInclude,
        skip,
        take: params.limit,
        orderBy: { [params.sort]: params.order },
      }),
      prisma.order.count({ where: where as any }),
    ])

    return {
      items: rows.map(toOrderResponse),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    }
  }

  static async getByIdWithRelations(id: string): Promise<OrderResponse | null> {
    const row = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    })
    return row ? toOrderResponse(row) : null
  }

  static async updateStatus(id: string, newStatus: string): Promise<OrderResponse> {
    const current = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    })
    if (!current) {
      throw Object.assign(new Error("order not found"), { statusCode: 404 })
    }

    const allowed = VALID_TRANSITIONS[current.status]
    if (!allowed || !allowed.includes(newStatus)) {
      throw Object.assign(
        new Error(`invalid status transition: ${current.status} → ${newStatus}`),
        { statusCode: 400 },
      )
    }

    const row = await prisma.order.update({
      where: { id },
      data: { status: newStatus as any },
      include: orderInclude,
    })
    return toOrderResponse(row)
  }

  static async updateNotes(id: string, notes: string): Promise<OrderResponse> {
    const row = await prisma.order.update({
      where: { id },
      data: { notes },
      include: orderInclude,
    })
    return toOrderResponse(row)
  }

  static async getStats(): Promise<{ totalOrders: number }> {
    const totalOrders = await prisma.order.count()
    return { totalOrders }
  }

  static async getStatusCounts(): Promise<{ completed: number; pending: number }> {
    const [completed, pending] = await Promise.all([
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
    ])
    return { completed, pending }
  }

  static async updatePayment(
    id: string,
    data: {
      method: string
      amount: number
      status: string
      paidAt?: string | null
    },
  ): Promise<OrderResponse> {
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: id },
    })

    if (existingPayment) {
      await prisma.payment.update({
        where: { orderId: id },
        data: {
          method: data.method as any,
          amount: data.amount,
          status: data.status as any,
          paidAt: data.paidAt ? new Date(data.paidAt) : null,
        },
      })
    } else {
      await prisma.payment.create({
        data: {
          orderId: id,
          method: data.method as any,
          amount: data.amount,
          status: data.status as any,
          paidAt: data.paidAt ? new Date(data.paidAt) : null,
        },
      })
    }

    const row = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    })
    return toOrderResponse(row!)
  }
}
