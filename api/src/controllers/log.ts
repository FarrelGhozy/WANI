import type { Request, Response } from "express";
import type { z } from "zod";
import { ActivityLogModel } from "@/models/activity-log";
import { sendResponse } from "@/utils/response";
import { getValidatedQuery } from "@/middleware/validate";
import { getOwnerId } from "@/middleware/owner";
import { logQuerySchema } from "@/schemas/log";

type LogQuery = z.infer<typeof logQuerySchema>;

export async function listLogs(
  req: Request<Record<string, string>, any, any, LogQuery>,
  res: Response
): Promise<void> {
  const ownerId = getOwnerId(req);
  const result = await ActivityLogModel.list(
    ownerId,
    getValidatedQuery<LogQuery>(req)
  );
  sendResponse(res, 200, "logs retrieved", result);
}

export async function getUsage(req: Request, res: Response): Promise<void> {
  const ownerId = getOwnerId(req);
  const usage = await ActivityLogModel.getDailyUsage(ownerId);
  sendResponse(res, 200, "usage retrieved", usage);
}
