import type { Request, Response } from "express"
import { MessageModel } from "@/src/models/message"
import { sendResponse } from "@/src/utils/response"

export async function listOutgoing(req: Request, res: Response): Promise<void> {
  const ownerId = req.query.ownerId as string | undefined
  const items = await MessageModel.listOutgoing(ownerId)
  sendResponse(res, 200, "outgoing messages", { items })
}

export async function markDelivered(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  await MessageModel.markDelivered(req.params.id)
  sendResponse(res, 200, "message marked as delivered")
}
