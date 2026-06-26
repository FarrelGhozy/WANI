import type { Request, Response } from "express"
import type { z } from "zod"
import { sendResponse } from "@/src/utils/response"
import { NotFoundError } from "@/src/utils/errors"
import { getTraces, getTraceById, clearTraces } from "@/src/debug/tracer"
import { getCircuitState, resetCircuit } from "@/src/ai/circuit-breaker"
import { getTracesQuerySchema, getTraceDetailParamsSchema } from "@/src/schemas/debug"

type GetTracesQuery = z.infer<typeof getTracesQuerySchema>
type GetTraceDetailParams = z.infer<typeof getTraceDetailParamsSchema>

export function getRecentTraces(
  req: Request<Record<string, string>, unknown, unknown, GetTracesQuery>,
  res: Response,
): void {
  const q = req.validatedQuery! as GetTracesQuery
  const limit = Number(q.limit)
  const traces = getTraces(limit)
  sendResponse(res, 200, "ok", { traces })
}

export function getTraceDetail(
  req: Request<GetTraceDetailParams>,
  res: Response,
): void {
  const { id } = req.params
  const trace = getTraceById(id)
  if (!trace) {
    throw new NotFoundError("Trace not found")
  }
  sendResponse(res, 200, "ok", { trace })
}

export function deleteTraces(_req: Request, res: Response): void {
  clearTraces()
  sendResponse(res, 200, "ok")
}

export function getStatus(_req: Request, res: Response): void {
  const uptime = process.uptime()
  const circuit = getCircuitState()
  sendResponse(res, 200, "ok", {
    circuitBreaker: { state: circuit.state, failures: circuit.failures, resetCircuit: "POST /api/debug/circuit/reset" },
    uptime,
    memory: process.memoryUsage(),
  })
}

export function postResetCircuit(_req: Request, res: Response): void {
  resetCircuit()
  sendResponse(res, 200, "ok", { message: "Circuit breaker reset" })
}
