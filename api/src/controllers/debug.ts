import type { Request, Response } from "express"
import { sendResponse } from "@/src/utils/response"
import { getTraces, getTraceById, clearTraces } from "@/src/debug/tracer"
import { resetCircuit } from "@/src/ai/circuit-breaker"

export function getRecentTraces(req: Request, res: Response): void {
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const traces = getTraces(limit)
  sendResponse(res, 200, "ok", { traces })
}

export function getTraceDetail(req: Request, res: Response): void {
  const trace = getTraceById(req.params.id)
  if (!trace) {
    sendResponse(res, 404, "Trace not found")
    return
  }
  sendResponse(res, 200, "ok", { trace })
}

export function deleteTraces(_req: Request, res: Response): void {
  clearTraces()
  sendResponse(res, 200, "ok")
}

export function getStatus(_req: Request, res: Response): void {
  const uptime = process.uptime()
  sendResponse(res, 200, "ok", {
    circuitBreaker: { state: "available", resetCircuit: "POST /api/debug/circuit/reset" },
    uptime,
    memory: process.memoryUsage(),
  })
}

export function postResetCircuit(_req: Request, res: Response): void {
  resetCircuit()
  sendResponse(res, 200, "ok", { message: "Circuit breaker reset" })
}
