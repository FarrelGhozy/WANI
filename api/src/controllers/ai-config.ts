import type { Request, Response } from "express"
import { AiConfigModel } from "@/src/models/ai-config"
import { sendResponse } from "@/src/utils/response"

export async function getAiConfig(_req: Request, res: Response): Promise<void> {
  const config = await AiConfigModel.find()
  sendResponse(res, 200, "ai config retrieved", config)
}

export async function upsertAiConfig(req: Request, res: Response): Promise<void> {
  const config = await AiConfigModel.upsert(req.body)
  sendResponse(res, 200, "ai config updated", config)
}
