import type { Request, Response } from "express"
import type { z } from "zod"
import { prisma } from "@/src/config/db"
import { ActivityLogModel } from "@/src/models/activity-log"
import { sendResponse } from "@/src/utils/response"
import { logQuerySchema } from "@/src/schemas/log"

type LogQuery = z.infer<typeof logQuerySchema>

export async function listLogs(
  req: Request<Record<string, string>, any, any, LogQuery>,
  res: Response,
): Promise<void> {
  const result = await ActivityLogModel.list(req.validatedQuery! as LogQuery)
  sendResponse(res, 200, "logs retrieved", result)
}

export async function getUsage(
  _req: Request,
  res: Response,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const counter = await prisma.usageCounter.findUnique({ where: { id: today } })
  sendResponse(res, 200, "usage retrieved", {
    llmCalls: counter?.llmCalls ?? 0,
    tokensIn: counter?.tokensIn ?? 0,
    tokensOut: counter?.tokensOut ?? 0,
  })
}
