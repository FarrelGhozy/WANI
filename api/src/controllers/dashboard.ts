import type { Request, Response } from "express"
import { getDashboardStats } from "@/src/models/dashboard"
import { sendResponse } from "@/src/utils/response"

export async function getStats(
  _req: Request,
  res: Response,
): Promise<void> {
  const stats = await getDashboardStats()
  sendResponse(res, 200, "stats retrieved", stats)
}
