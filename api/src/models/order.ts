import { BaseModel } from "@/src/models/base"
import type { Prisma, $Enums } from "@db/client"
import { BadRequestError, NotFoundError } from "@/src/utils/errors"

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

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>

function toOrderResponse(row: OrderRow): OrderResponse {
  return {
    id: row.id,
    customerId: row.customerId,
    customer: row.customer,
    status: row.status,
    totalAmount: Number(row.totalAmount),
    source: row.source,
    notes: row.notes ?? null,
    items: (row.items ?? []).map((i) => ({
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

const VALID_TRANSITIONS: Record<$Enums.OrderStatus, $Enums.OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

export class OrderModel extends BaseModel {
  protected static override get delegate() {
    return this.db.order
  }

  static async createFromItems(
    ownerId: string,
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

    const order = await this.db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          id: orderId,
          ownerId,
          customerId,
          totalAmount,
          notes: notes ?? null,
          source: "wa_chat",
        },
      })

      await tx.orderItem.createMany({ data: orderItems })

      return o
    })

    return { order, orderItems }
  }

  static async list(ownerId: string, params: {
    page: number | string
    limit: number | string
    status?: string
    customerId?: string
    dateFrom?: string
    dateTo?: string
    sort: string
    order: string
  }): Promise<OrderListResult> {
    const { page, limit, skip } = this.paginate(params.page, params.limit)
    const where: Record<string, unknown> = { ownerId }

    if (params.status) where.status = params.status
    if (params.customerId) where.customerId = params.customerId
    if (params.dateFrom || params.dateTo) {
      const createdAt: Record<string, string> = {}
      if (params.dateFrom) createdAt.gte = params.dateFrom
      if (params.dateTo) createdAt.lte = params.dateTo
      where.createdAt = createdAt
    }

    const w = where as Prisma.OrderWhereInput
    const [rows, total] = await Promise.all([
      this.delegate.findMany({ where: w, include: orderInclude, skip, take: limit, orderBy: { [params.sort]: params.order } }),
      this.delegate.count({ where: w }),
    ])

    return this.listResult(rows.map(toOrderResponse), total, page, limit)
  }

  static async getByIdWithRelations(id: string): Promise<OrderResponse | null> {
    const row = await this.delegate.findUnique({
      where: { id },
      include: orderInclude,
    })
    return row ? toOrderResponse(row) : null
  }

  static async updateStatus(id: string, newStatus: $Enums.OrderStatus): Promise<OrderResponse> {
    const current = await this.delegate.findUnique({
      where: { id },
      select: { status: true, stockReleased: true },
    })
    if (!current) {
      throw new NotFoundError("order not found")
    }

    const allowed = VALID_TRANSITIONS[current.status as $Enums.OrderStatus]
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestError(`invalid status transition: ${current.status} → ${newStatus}`)
    }

    if (newStatus === "CONFIRMED" && !current.stockReleased) {
      await this.db.$transaction(async (tx) => {
        const items = await tx.orderItem.findMany({
          where: { orderId: id },
          include: { product: { select: { name: true, stock: true } } },
        })

        for (const item of items) {
          if (item.product.stock < item.qty) {
            throw new BadRequestError(
              `Stok "${item.product.name}" tidak mencukupi (tersedia ${item.product.stock}, diminta ${item.qty})`,
            )
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.qty } },
          })
        }

        await tx.order.update({
          where: { id },
          data: { status: newStatus, stockReleased: true },
        })
      })
    } else if (newStatus === "CANCELLED" && current.stockReleased) {
      await this.db.$transaction(async (tx) => {
        const items = await tx.orderItem.findMany({
          where: { orderId: id },
        })

        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          })
        }

        await tx.order.update({
          where: { id },
          data: { status: newStatus, stockReleased: false },
        })
      })
    } else {
      await this.delegate.update({
        where: { id },
        data: { status: newStatus },
      })
    }

    const row = await this.delegate.findUniqueOrThrow({
      where: { id },
      include: orderInclude,
    })
    return toOrderResponse(row)
  }

  static async updateNotes(id: string, notes: string): Promise<OrderResponse> {
    const row = await this.delegate.update({
      where: { id },
      data: { notes },
      include: orderInclude,
    })
    return toOrderResponse(row)
  }

  static async getStats(ownerId: string): Promise<{ totalOrders: number }> {
    const totalOrders = await this.delegate.count({ where: { ownerId } })
    return { totalOrders }
  }

  static async getStatusCounts(ownerId: string): Promise<{ completed: number; pending: number }> {
    const [completed, pending] = await Promise.all([
      this.delegate.count({ where: { ownerId, status: "COMPLETED" } }),
      this.delegate.count({ where: { ownerId, status: "PENDING" } }),
    ])
    return { completed, pending }
  }

  static async updatePayment(
    id: string,
    data: {
      method: $Enums.PaymentMethod
      amount: number
      status: $Enums.PaymentStatus
      paidAt?: string | null
    },
  ): Promise<OrderResponse> {
    await this.db.$transaction(async (tx) => {
      const prev = await tx.payment.findUnique({ where: { orderId: id } })
      if (prev?.status === "PAID") {
        throw new BadRequestError("pembayaran sudah dikonfirmasi sebelumnya")
      }

      await tx.payment.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          method: data.method,
          amount: data.amount,
          status: data.status,
          paidAt: data.paidAt ? new Date(data.paidAt) : null,
        },
        update: {
          method: data.method,
          amount: data.amount,
          status: data.status,
          paidAt: data.paidAt ? new Date(data.paidAt) : null,
        },
      })

      if (data.status === "PAID") {
        const order = await tx.order.findUnique({
          where: { id },
          select: { status: true, stockReleased: true },
        })

        if (order && !order.stockReleased) {
          const items = await tx.orderItem.findMany({
            where: { orderId: id },
            include: { product: { select: { name: true, stock: true } } },
          })

          for (const item of items) {
            if (item.product.stock < item.qty) {
              throw new BadRequestError(
                `Stok "${item.product.name}" tidak mencukupi (tersedia ${item.product.stock}, diminta ${item.qty})`,
              )
            }
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.qty } },
            })
          }

          await tx.order.update({
            where: { id },
            data: { status: "CONFIRMED", stockReleased: true },
          })
        }
      }
    })

    const row = await this.delegate.findUniqueOrThrow({
      where: { id },
      include: orderInclude,
    })
    return toOrderResponse(row)
  }
}
