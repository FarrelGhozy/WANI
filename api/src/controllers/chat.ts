import type { Request, Response } from "express"
import type { z } from "zod"
import { processMessage } from "@/ai/pipeline"
import { sendResponse } from "@/utils/response"
import { getOwnerIdOrFirst } from "@/middleware/owner"
import { chatRequestSchema } from "@/schemas/chat"

type ChatRequestBody = z.infer<typeof chatRequestSchema>

export async function postChat(
  req: Request<Record<string, string>, any, ChatRequestBody>,
  res: Response,
): Promise<void> {
  const { phone, name, text, waMsgId } = req.body
  const ownerId = req.body.ownerId ?? await getOwnerIdOrFirst(req)
  const result = await processMessage({ ownerId, phone, name, text, waMsgId })
  sendResponse(res, 200, "ok", { reply: result.reply, intent: result.intent, qrisImageUrl: result.qrisImageUrl ?? null })
}
