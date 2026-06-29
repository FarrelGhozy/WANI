import type { Request, Response } from "express"
import { MessageModel } from "@/src/models/message"
import { sendResponse } from "@/src/utils/response"

export async function listOutgoing(_req: Request, res: Response): Promise<void> {
  const items = await MessageModel.listOutgoing()
  sendResponse(res, 200, "outgoing messages", { items })
}

export async function markDelivered(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  await MessageModel.markDelivered(req.params.id)
  sendResponse(res, 200, "message marked as delivered")
}
