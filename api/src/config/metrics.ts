import client from "prom-client"
import type { Request, Response, NextFunction } from "express"

const register = new client.Registry()

client.collectDefaultMetrics({ register })

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in ms",
  labelNames: ["method", "route", "status"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 3000],
  registers: [register],
})

export const llmCallsTotal = new client.Counter({
  name: "llm_calls_total",
  help: "Total LLM calls",
  labelNames: ["model", "outcome"],
  registers: [register],
})

export const circuitBreakerState = new client.Gauge({
  name: "circuit_breaker_state",
  help: "Circuit breaker state (0=closed, 1=open, 2=half-open)",
  labelNames: ["state"],
  registers: [register],
})

export const rateLimitBlocks = new client.Counter({
  name: "rate_limit_blocks_total",
  help: "Total rate limit blocks",
  registers: [register],
})

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const end = httpRequestDuration.startTimer()
  res.on("finish", () => {
    end({ method: req.method, route: req.route?.path ?? req.path, status: res.statusCode })
  })
  next()
}

export function getMetrics(): Promise<string> {
  return register.metrics()
}
