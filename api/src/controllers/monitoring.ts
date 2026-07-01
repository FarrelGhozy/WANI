import type { Request, Response } from "express"
import { prisma } from "@/src/config/db"
import { env } from "@/src/config/env"
import { getMetrics } from "@/src/config/metrics"
import { sendResponse } from "@/src/utils/response"

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const checks: Record<string, string> = {}
  let healthy = true

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = "ok"
  } catch {
    checks.database = "error"
    healthy = false
  }

  checks.llm = env.ai.llmApiKey ? "configured" : "missing"
  if (!env.ai.llmApiKey) healthy = false

  sendResponse(res, healthy ? 200 : 503, healthy ? "healthy" : "unhealthy", { checks })
}

export async function getMetricsHandler(_req: Request, res: Response): Promise<void> {
  res.type("text/plain")
  res.send(await getMetrics())
}
