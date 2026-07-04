import { prisma } from "@/src/config/db"
import { WaSessionModel } from "@/src/models/wa-session"

export type DashboardStats = {
  ordersToday: number
  ordersPending: number
  productsActive: number
  customersTotal: number
  conversationsActive: number
  qr: { qr: string | null; status: string; phone: string | null }
}

export async function getDashboardStats(ownerId: string): Promise<DashboardStats> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    ordersToday,
    ordersPending,
    productsActive,
    customersTotal,
    conversationsActive,
    waSession,
  ] = await Promise.all([
    prisma.order.count({ where: { ownerId, createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { ownerId, status: "PENDING" } }),
    prisma.product.count({ where: { ownerId, isAvailable: true } }),
    prisma.customer.count({ where: { ownerId } }),
    prisma.conversation.count({ where: { ownerId, status: "ACTIVE" } }),
    WaSessionModel.find(),
  ])

  return {
    ordersToday,
    ordersPending,
    productsActive,
    customersTotal,
    conversationsActive,
    qr: {
      qr: waSession?.qr ?? null,
      status: waSession?.status ?? "disconnected",
      phone: waSession?.phone ?? null,
    },
  }
}
