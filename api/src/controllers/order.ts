import type { Request, Response } from "express"
import type { z } from "zod"
import { OrderModel } from "@/src/models/order"
import { sendResponse } from "@/src/utils/response"
import { NotFoundError, BadRequestError } from "@/src/utils/errors"
import {
  orderQuerySchema,
  updateOrderStatusSchema,
  updateOrderNotesSchema,
  updateOrderPaymentSchema,
} from "@/src/schemas/order"

type OrderQuery = z.infer<typeof orderQuerySchema>
type UpdateStatusBody = z.infer<typeof updateOrderStatusSchema>
type UpdateNotesBody = z.infer<typeof updateOrderNotesSchema>
type UpdatePaymentBody = z.infer<typeof updateOrderPaymentSchema>

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

function checkStatusTransition(current: string, next: string): void {
  const allowed = VALID_TRANSITIONS[current]
  if (!allowed || !allowed.includes(next)) {
    throw new BadRequestError(`invalid status transition: ${current} → ${next}`)
  }
}

export async function listOrders(
  req: Request<Record<string, string>, any, any, OrderQuery>,
  res: Response,
): Promise<void> {
  const result = await OrderModel.list((req as any).validatedQuery ?? req.query)
  sendResponse(res, 200, "orders retrieved", result)
}

export async function getOrder(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const order = await OrderModel.getByIdWithRelations(req.params.id)
  if (!order) {
    throw new NotFoundError("order not found")
  }
  sendResponse(res, 200, "order retrieved", order)
}

export async function updateOrderStatus(
  req: Request<{ id: string }, any, UpdateStatusBody>,
  res: Response,
): Promise<void> {
  const existing = await OrderModel.getByIdWithRelations(req.params.id)
  if (!existing) {
    throw new NotFoundError("order not found")
  }
  checkStatusTransition(existing.status, req.body.status)
  const order = await OrderModel.updateStatus(req.params.id, req.body.status)
  sendResponse(res, 200, "order status updated", order)
}

export async function updateOrderNotes(
  req: Request<{ id: string }, any, UpdateNotesBody>,
  res: Response,
): Promise<void> {
  const existing = await OrderModel.getByIdWithRelations(req.params.id)
  if (!existing) {
    throw new NotFoundError("order not found")
  }
  const order = await OrderModel.updateNotes(req.params.id, req.body.notes)
  sendResponse(res, 200, "order notes updated", order)
}

export async function updateOrderPayment(
  req: Request<{ id: string }, any, UpdatePaymentBody>,
  res: Response,
): Promise<void> {
  const existing = await OrderModel.getByIdWithRelations(req.params.id)
  if (!existing) {
    throw new NotFoundError("order not found")
  }
  const order = await OrderModel.updatePayment(req.params.id, req.body)
  sendResponse(res, 200, "payment updated", order)
}
