import type { Request, Response } from "express"
import type { z } from "zod"
import { OrderModel } from "@/src/models/order"
import { ConversationModel } from "@/src/models/conversation"
import { MessageModel } from "@/src/models/message"
import { sendResponse } from "@/src/utils/response"
import { NotFoundError } from "@/src/utils/errors"
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

export async function listOrders(
  req: Request<Record<string, string>, any, any, OrderQuery>,
  res: Response,
): Promise<void> {
  const result = await OrderModel.list(req.validatedQuery! as OrderQuery)
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

export async function updateOrderStatus(
  req: Request<{ id: string }, any, UpdateStatusBody>,
  res: Response,
): Promise<void> {
  const order = await OrderModel.updateStatus(req.params.id, req.body.status as $Enums.OrderStatus)
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
      content: "Terima kasih! Pembayaran untuk pesanan Anda sudah dikonfirmasi. Pesanan sedang kami proses ya.",
    })
    await ConversationModel.touch(conv.id)
  }

  sendResponse(res, 200, "payment updated", order)
}
