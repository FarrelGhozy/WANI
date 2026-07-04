import type { Request, Response } from "express"
import type { z } from "zod"
import { CustomerModel } from "@/src/models/customer"
import { ConversationModel } from "@/src/models/conversation"
import { MessageModel } from "@/src/models/message"
import { sendResponse } from "@/src/utils/response"
import { NotFoundError } from "@/src/utils/errors"
import { getValidatedQuery } from "@/src/middleware/validate"
import { getOwnerId, getOwnerIdOrFirst } from "@/src/middleware/owner"
import { customerQuerySchema, updateCustomerSchema } from "@/src/schemas/customer"
import { updateConversationStatusSchema, sendMessageSchema } from "@/src/schemas/customer"

type CustomerQuery = z.infer<typeof customerQuerySchema>
type UpdateCustomerBody = z.infer<typeof updateCustomerSchema>
type UpdateConvStatusBody = z.infer<typeof updateConversationStatusSchema>
type SendMessageBody = z.infer<typeof sendMessageSchema>

export async function listCustomers(
  req: Request<Record<string, string>, any, any, CustomerQuery>,
  res: Response,
): Promise<void> {
  const ownerId = await getOwnerIdOrFirst(req)
  const result = await CustomerModel.list(ownerId, getValidatedQuery<CustomerQuery>(req))
  sendResponse(res, 200, "customers retrieved", result)
}

export async function getCustomer(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const customer = await CustomerModel.getByIdWithDetail(req.params.id)
  if (!customer) {
    throw new NotFoundError("customer not found")
  }
  sendResponse(res, 200, "customer retrieved", customer)
}

export async function updateCustomer(
  req: Request<{ id: string }, any, UpdateCustomerBody>,
  res: Response,
): Promise<void> {
  getOwnerId(req)
  await CustomerModel.getOrThrow(req.params.id, "customer")
  const customer = await CustomerModel.update(req.params.id, req.body)
  sendResponse(res, 200, "customer updated", customer)
}

export async function getConversation(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const messages = await MessageModel.recentByConversation(req.params.id, 100)
  if (messages.length === 0) {
    throw new NotFoundError("conversation not found")
  }
  sendResponse(res, 200, "conversation retrieved", {
    id: req.params.id,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      msgType: m.msgType,
      waMsgId: m.waMsgId ?? null,
      metadata: m.metadata as Record<string, unknown> | null,
      createdAt: m.createdAt.toISOString(),
    })),
  })
}

export async function updateConversationStatus(
  req: Request<{ id: string }, any, UpdateConvStatusBody>,
  res: Response,
): Promise<void> {
  getOwnerId(req)
  await ConversationModel.setStatus(req.params.id, req.body.status)
  sendResponse(res, 200, "conversation status updated")
}

export async function sendMessage(
  req: Request<{ id: string }, any, SendMessageBody>,
  res: Response,
): Promise<void> {
  const ownerId = getOwnerId(req)
  const msg = await MessageModel.append({
    ownerId,
    conversationId: req.params.id,
    role: "HUMAN",
    content: req.body.text,
  })
  await ConversationModel.touch(req.params.id)
  sendResponse(res, 201, "message sent", {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  })
}
