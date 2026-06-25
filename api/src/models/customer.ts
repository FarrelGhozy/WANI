import { prisma } from "@/src/config/db"
import { BaseModel } from "@/src/models/base"
import type { Customer, Prisma } from "@db/client"

export type CustomerListItem = {
  id: string
  phone: string
  name: string
  notes: string | null
  totalOrders: number
  unreadCount: number
  lastMessage: { content: string; role: string; createdAt: string } | null
  recentOrder: { id: string; status: string; totalAmount: number; createdAt: string } | null
  createdAt: string
  updatedAt: string
}

export type CustomerDetail = {
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
}

export type CustomerListResult = {
  items: CustomerListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class CustomerModel extends BaseModel {
  protected static override get delegate() {
    return this.db.customer
  }

  static async upsertByPhone(phone: string, name?: string): Promise<Customer> {
    const existing = await this.delegate.findUnique({ where: { phone } })
    if (existing) {
      if (name && existing.name !== name) {
        return this.delegate.update({
          where: { phone },
          data: { name },
        })
      }
      return existing
    }
    return this.delegate.create({
      data: { phone, name: name ?? phone },
    })
  }

  static async incrementOrders(id: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { totalOrders: { increment: 1 } },
    })
  }

  static async list(params: {
    page: number | string
    limit: number | string
    search?: string
    sort: string
    order: string
  }): Promise<CustomerListResult> {
    const { page, limit, skip } = this.paginate(params.page, params.limit)
    const where: Record<string, unknown> = {}

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search } },
      ]
    }

    const w = where as Prisma.CustomerWhereInput
    const [customers, total] = await Promise.all([
      this.delegate.findMany({ where: w, skip, take: limit, orderBy: { [params.sort]: params.order } }),
      this.delegate.count({ where: w }),
    ])

    const customerIds = customers.map((c: Customer) => c.id)

    const [lastMessages, recentOrders] = await Promise.all([
      fetchLastMessages(customerIds),
      fetchRecentOrders(customerIds),
    ])

    const lastMsgMap = new Map(lastMessages.map((r) => [r.customerId, r]))
    const recentOrderMap = new Map(recentOrders.map((r) => [r.customerId, r]))

    const items: CustomerListItem[] = customers.map((c: Customer) => {
      const lm = lastMsgMap.get(c.id)
      const ro = recentOrderMap.get(c.id)
      return {
        id: c.id,
        phone: c.phone,
        name: c.name,
        notes: c.notes ?? null,
        totalOrders: c.totalOrders,
        unreadCount: 0,
        lastMessage: lm
          ? { content: lm.content, role: lm.role, createdAt: lm.createdAt.toISOString() }
          : null,
        recentOrder: ro
          ? {
              id: ro.id,
              status: ro.status,
              totalAmount: Number(ro.totalAmount),
              createdAt: ro.createdAt.toISOString(),
            }
          : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }
    })

    return this.listResult(items, total, page, limit)
  }

  static async getByIdWithDetail(id: string): Promise<CustomerDetail | null> {
    const customer = await this.delegate.findUnique({
      where: { id },
    })
    if (!customer) return null

    const [orders, conversation] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      prisma.conversation.findFirst({
        where: { customerId: id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 100,
          },
        },
      }),
    ])

    return {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      notes: customer.notes ?? null,
      totalOrders: customer.totalOrders,
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt.toISOString(),
      })),
      conversation: conversation
        ? {
            id: conversation.id,
            status: conversation.status,
            messages: conversation.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              msgType: m.msgType,
              waMsgId: m.waMsgId ?? null,
              metadata: m.metadata as Record<string, unknown> | null,
              createdAt: m.createdAt.toISOString(),
            })),
          }
        : null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    }
  }
}

type LastMessageRow = {
  customerId: string
  content: string
  role: string
  createdAt: Date
}

async function fetchLastMessages(customerIds: string[]): Promise<LastMessageRow[]> {
  if (customerIds.length === 0) return []

  const rows = await prisma.$queryRaw<LastMessageRow[]>`
    SELECT DISTINCT ON (conv."customerId")
      conv."customerId"::text,
      msg.content::text,
      msg.role::text,
      msg."createdAt"
    FROM "Conversation" conv
    JOIN "Message" msg ON msg."conversationId" = conv.id
    WHERE conv."customerId" = ANY(${customerIds}::text[])
    ORDER BY conv."customerId", msg."createdAt" DESC
  `

  return rows
}

type RecentOrderRow = {
  customerId: string
  id: string
  status: string
  totalAmount: number
  createdAt: Date
}

async function fetchRecentOrders(customerIds: string[]): Promise<RecentOrderRow[]> {
  if (customerIds.length === 0) return []

  const rows = await prisma.$queryRaw<RecentOrderRow[]>`
    SELECT DISTINCT ON (o."customerId")
      o."customerId"::text,
      o.id::text,
      o.status::text,
      o."totalAmount",
      o."createdAt"
    FROM "Order" o
    WHERE o."customerId" = ANY(${customerIds}::text[])
    ORDER BY o."customerId", o."createdAt" DESC
  `

  return rows.map((r) => ({
    ...r,
    totalAmount: Number(r.totalAmount),
  }))
}
