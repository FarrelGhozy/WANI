import type { Request, Response } from "express"
import type { z } from "zod"
import { OrderModel, type OrderResponse } from "@/src/models/order"
import { ConversationModel } from "@/src/models/conversation"
import { MessageModel } from "@/src/models/message"
import { sendResponse } from "@/src/utils/response"
import { NotFoundError } from "@/src/utils/errors"
import { getValidatedQuery } from "@/src/middleware/validate"
import {
  orderQuerySchema,
  updateOrderStatusSchema,
  updateOrderNotesSchema,
  updateOrderPaymentSchema,
} from "@/src/schemas/order"
import type { $Enums } from "@db/client"

type OrderQuery = z.infer<typeof orderQuerySchema>
type UpdateStatusBody = z.infer<typeof updateOrderStatusSchema>
type UpdateNotesBody = z.infer<typeof updateOrderNotesSchema>
type UpdatePaymentBody = z.infer<typeof updateOrderPaymentSchema>

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const month = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, "0")
  const minutes = d.getMinutes().toString().padStart(2, "0")
  return `${day} ${month} ${year} • ${hours}:${minutes}`
}

function shortId(id: string): string {
  const parts = id.split("-")
  const code = parts.length >= 2 ? parts[1]! : id
  return `#${code.toUpperCase().padStart(3, "0").slice(0, 6)}`
}

function fmtPrice(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`
}

function buildNotification(order: OrderResponse, statusMsg: string): string {
  const items = order.items
    .map((i) => `• ${i.qty}x ${i.product.name} — ${fmtPrice(i.subtotal)}`)
    .join("\n")

  return [
    `━━━ PESANAN ${shortId(order.id)} ━━━`,
    formatDate(order.createdAt),
    "",
    items,
    `─────────────────`,
    `Total: ${fmtPrice(order.totalAmount)}`,
    "",
    statusMsg,
  ].join("\n")
}

export async function listOrders(
  req: Request<Record<string, string>, any, any, OrderQuery>,
  res: Response,
): Promise<void> {
  const result = await OrderModel.list(getValidatedQuery<OrderQuery>(req))
  sendResponse(res, 200, "orders retrieved", result)
}

export async function getOrder(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const order = await OrderModel.getByIdWithRelations(req.params.id)
  if (!order) throw new NotFoundError("order not found")
  sendResponse(res, 200, "order retrieved", order)
}

const STATUS_MSGS: Record<string, string> = {
  CONFIRMED: "✅ Pesanan sudah dikonfirmasi. Kami akan segera memproses pesanan Anda. Terima kasih!",
  PROCESSING: "⏳ Pesanan sedang kami proses. Kami akan kabari jika sudah selesai.",
  COMPLETED: "🎉 Pesanan sudah selesai! Terima kasih telah berbelanja dengan kami. Silakan datang kembali!",
  CANCELLED: "❌ Pesanan telah dibatalkan. Hubungi kami jika ada pertanyaan.",
}

export async function updateOrderStatus(
  req: Request<{ id: string }, any, UpdateStatusBody>,
  res: Response,
): Promise<void> {
  const order = await OrderModel.updateStatus(req.params.id, req.body.status as $Enums.OrderStatus)

  const statusMsg = STATUS_MSGS[order.status]
  if (statusMsg) {
    const conv = await ConversationModel.findOrCreateActive(order.customerId)
    await MessageModel.append({
      conversationId: conv.id,
      role: "BOT",
      msgType: "notification",
      content: buildNotification(order, statusMsg),
    })
    await ConversationModel.touch(conv.id)
  }

  sendResponse(res, 200, "order status updated", order)
}

export async function updateOrderNotes(
  req: Request<{ id: string }, any, UpdateNotesBody>,
  res: Response,
): Promise<void> {
  const order = await OrderModel.updateNotes(req.params.id, req.body.notes)
  sendResponse(res, 200, "order notes updated", order)
}

export async function updateOrderPayment(
  req: Request<{ id: string }, any, UpdatePaymentBody>,
  res: Response,
): Promise<void> {
  const order = await OrderModel.updatePayment(req.params.id, {
    method: req.body.method as $Enums.PaymentMethod,
    amount: req.body.amount,
    status: req.body.status as $Enums.PaymentStatus,
    paidAt: req.body.paidAt ?? null,
  })

  if (order.status === "CONFIRMED") {
    const conv = await ConversationModel.findOrCreateActive(order.customerId)
    await MessageModel.append({
      conversationId: conv.id,
      role: "BOT",
      msgType: "notification",
      content: buildNotification(order, "✅ Pembayaran sudah dikonfirmasi! Pesanan Anda sedang kami proses."),
    })
    await ConversationModel.touch(conv.id)
  }

  sendResponse(res, 200, "payment updated", order)
}
