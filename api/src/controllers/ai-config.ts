import type { Request, Response } from "express"
import type { z } from "zod"
import { AiConfigModel } from "@/src/models/ai-config"
import { sendResponse } from "@/src/utils/response"
import { upsertAiConfigSchema } from "@/src/schemas/ai-config"

type UpsertAiConfigBody = z.infer<typeof upsertAiConfigSchema>

export async function getAiConfig(_req: Request, res: Response): Promise<void> {
  const config = await AiConfigModel.find()
  sendResponse(res, 200, "ai config retrieved", config)
}

export async function upsertAiConfig(
  req: Request<Record<string, string>, any, UpsertAiConfigBody>,
  res: Response,
): Promise<void> {
  const config = await AiConfigModel.upsert(req.body)
  sendResponse(res, 200, "ai config updated", config)
}
