import type { Request, Response } from "express";
import { getDashboardStats } from "@/models/dashboard";
import { sendResponse } from "@/utils/response";
import { getOwnerId } from "@/middleware/owner";

export async function getStats(req: Request, res: Response): Promise<void> {
  const ownerId = getOwnerId(req);
  const stats = await getDashboardStats(ownerId);
  sendResponse(res, 200, "stats retrieved", stats);
}
