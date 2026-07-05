import type { Request, Response } from "express"
import type { z } from "zod"
import { ActivityLogModel } from "@/src/models/activity-log"
import { sendResponse } from "@/src/utils/response"
import { getValidatedQuery } from "@/src/middleware/validate"
import { getOwnerIdOrFirst } from "@/src/middleware/owner"
import { logQuerySchema } from "@/src/schemas/log"

type LogQuery = z.infer<typeof logQuerySchema>

export async function listLogs(
  req: Request<Record<string, string>, any, any, LogQuery>,
  res: Response,
): Promise<void> {
  const ownerId = await getOwnerIdOrFirst(req)
  const result = await ActivityLogModel.list(ownerId, getValidatedQuery<LogQuery>(req))
  sendResponse(res, 200, "logs retrieved", result)
}

export async function getUsage(
  _req: Request,
  res: Response,
): Promise<void> {
  const usage = await ActivityLogModel.getDailyUsage()
  sendResponse(res, 200, "usage retrieved", usage)
}
