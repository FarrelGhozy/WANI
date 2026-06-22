import type { Request, Response } from "express"
import { processMessage } from "@/src/ai/pipeline"
import { sendResponse } from "@/src/utils/response"

export async function postChat(req: Request, res: Response): Promise<void> {
  const { phone, name, text, waMsgId } = req.body
  const result = await processMessage({ phone, name, text, waMsgId })
  sendResponse(res, 200, "ok", { reply: result.reply, intent: result.intent })
}
