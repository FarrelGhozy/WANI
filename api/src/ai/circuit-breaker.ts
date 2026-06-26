import { logger } from "@/src/config/logger"

interface State {
  failures: number
  lastFailure: number
  halfOpen: boolean
}

const state: State = { failures: 0, lastFailure: 0, halfOpen: false }

const THRESHOLD = 3
const COOLDOWN_MS = 60_000
const HALF_OPEN_TIMEOUT_MS = 30_000

export interface CircuitResult<T> {
  allowed: boolean
  result?: T
  error?: Error
}

export async function withCircuit<T>(
  fn: () => Promise<T>,
  label = "llm",
): Promise<CircuitResult<T>> {
  const now = Date.now()

  if (state.failures >= THRESHOLD) {
    const elapsed = now - state.lastFailure
    if (elapsed < COOLDOWN_MS) {
      logger.warn("Circuit breaker OPEN", { label, failures: state.failures, elapsed })
      return { allowed: false }
    }
    if (!state.halfOpen) {
      state.halfOpen = true
      logger.info("Circuit breaker HALF-OPEN", { label })
    }
  }

  try {
    const result = await fn()
    state.failures = 0
    state.lastFailure = 0
    state.halfOpen = false
    return { allowed: true, result }
  } catch (err) {
    state.failures++
    state.lastFailure = now
    state.halfOpen = false
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error("Circuit breaker failure", { label, failures: state.failures, error: error.message })
    return { allowed: false, error }
  }
}

export function getCircuitState(): { state: "closed" | "open" | "half-open"; failures: number } {
  if (state.halfOpen) return { state: "half-open", failures: state.failures }
  if (state.failures >= THRESHOLD) return { state: "open", failures: state.failures }
  return { state: "closed", failures: state.failures }
}

export function resetCircuit(): void {
  state.failures = 0
  state.lastFailure = 0
  state.halfOpen = false
}
