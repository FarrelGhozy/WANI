// ─── Pipeline tracer: per-request debug context with ring buffer ────────

import crypto from "node:crypto"

export interface TraceStep {
  name: string
  durationMs: number
  data: Record<string, unknown>
}

export interface Trace {
  id: string
  phone: string
  startedAt: string
  finishedAt: string | null
  totalDurationMs: number | null
  steps: TraceStep[]
  result: { reply: string; intent: string; blocked: boolean } | null
  error: string | null
}

export class TraceContext {
  readonly id: string
  readonly phone: string
  readonly startedAt: string
  private steps: TraceStep[] = []
  private currentStep: { name: string; start: number; data: Record<string, unknown> } | null = null
  private _result: Trace["result"] | null = null
  private _error: string | null = null
  private _finishedAt: string | null = null

  constructor(phone: string) {
    this.id = crypto.randomUUID().slice(0, 8)
    this.phone = phone
    this.startedAt = new Date().toISOString()
  }

  /** Start a named step (auto-finalizes previous). */
  begin(name: string): this {
    this.finalizeCurrent()
    this.currentStep = { name, start: performance.now(), data: {} }
    return this
  }

  /** Set key/value on the current step. */
  set(key: string, value: unknown): this {
    if (this.currentStep) this.currentStep.data[key] = value
    return this
  }

  /** Finalize the current step (auto-called by begin() and finish()). */
  finalizeCurrent(): void {
    if (!this.currentStep) return
    const durationMs = Math.round((performance.now() - this.currentStep.start) * 100) / 100
    this.steps.push({ name: this.currentStep.name, durationMs, data: this.currentStep.data })
    this.currentStep = null
  }

  /** Mark the trace as complete with result or error. */
  finish(result?: Trace["result"], error?: string): void {
    this.finalizeCurrent()
    this._finishedAt = new Date().toISOString()
    if (result) this._result = result
    if (error) this._error = error
  }

  toTrace(): Trace {
    const total = this._finishedAt
      ? Math.round((new Date(this._finishedAt).getTime() - new Date(this.startedAt).getTime()) * 100) / 100
      : null
    return {
      id: this.id,
      phone: this.phone,
      startedAt: this.startedAt,
      finishedAt: this._finishedAt,
      totalDurationMs: total,
      steps: this.steps,
      result: this._result,
      error: this._error,
    }
  }
}

// ─── Ring buffer ────────────────────────────────────────────────────────

const MAX_TRACES = 500
const traces: Trace[] = []

export function storeTrace(ctx: TraceContext): void {
  traces.unshift(ctx.toTrace())
  if (traces.length > MAX_TRACES) traces.length = MAX_TRACES
}

export function getTraces(limit = 50): Trace[] {
  return traces.slice(0, limit)
}

export function getTraceById(id: string): Trace | undefined {
  return traces.find((t) => t.id === id)
}

export function clearTraces(): void {
  traces.length = 0
}
