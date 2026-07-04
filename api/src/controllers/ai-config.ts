import type { Request, Response } from "express"
import type { z } from "zod"
import { AiConfigModel } from "@/src/models/ai-config"
import { sendResponse } from "@/src/utils/response"
import { getOwnerId, getOwnerIdOrFirst } from "@/src/middleware/owner"
import { upsertAiConfigSchema } from "@/src/schemas/ai-config"

type UpsertAiConfigBody = z.infer<typeof upsertAiConfigSchema>

export async function getAiConfig(req: Request, res: Response): Promise<void> {
  const ownerId = await getOwnerIdOrFirst(req)
  const config = await AiConfigModel.findByOwner(ownerId)
  sendResponse(res, 200, "ai config retrieved", config ?? {})
}

export async function upsertAiConfig(
  req: Request<Record<string, string>, any, UpsertAiConfigBody>,
  res: Response,
): Promise<void> {
  const ownerId = getOwnerId(req)
  const config = await AiConfigModel.upsertByOwner(ownerId, req.body)
  sendResponse(res, 200, "ai config updated", config)
}
