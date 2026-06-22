import { prisma } from "@/src/config/db"
import type { Order, OrderItem } from "@db/client"

export interface CreateItemInput {
  productId: string
  productName: string
  unitPrice: number
  qty: number
}

export class OrderModel {
  static async createFromItems(
    customerId: string,
    items: CreateItemInput[],
    notes?: string,
  ): Promise<{ order: Order; orderItems: OrderItem[] }> {
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
        await tx.orderItem.create({ data: oi as any })
      }

      return o
    })

    return { order, orderItems: orderItems as any }
  }
}
