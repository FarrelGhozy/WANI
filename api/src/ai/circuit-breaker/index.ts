import { logger } from "@/src/config/logger";
import { State, type CircuitResult, type CircuitState } from "@/src/types/ai";

export { State, type CircuitResult, type CircuitState };

// internal interface
interface BreakerStatus {
  failures: number;
  lastFailure: number;
  halfOpen: boolean;
}

class CircuitBreaker {
  private status: BreakerStatus = {
    failures: 0,
    lastFailure: 0,
    halfOpen: false,
  };
  private locked = false;
  private queue: Array<() => void> = [];

  constructor(
    private readonly label: string,
    private readonly threshold = 3,
    private readonly cooldownMs = 60_000,
  ) {}

  get state(): CircuitState {
    if (this.status.halfOpen)
      return { state: State.HalfOpen, failures: this.status.failures };
    if (this.status.failures >= this.threshold)
      return { state: State.Open, failures: this.status.failures };
    return { state: State.Closed, failures: this.status.failures };
  }

  reset(): void {
    this.status = { failures: 0, lastFailure: 0, halfOpen: false };
  }

  async call<T>(fn: () => Promise<T>): Promise<CircuitResult<T>> {
    if (this.locked) {
      await new Promise<void>((r) => this.queue.push(r));
    }
    this.locked = true;
    try {
      return await this.callUnsafe(fn);
    } finally {
      this.locked = false;
      const next = this.queue.shift();
      if (next) next();
    }
  }

  private shouldReject(now: number): boolean {
    if (this.status.failures < this.threshold) return false;
    if (now - this.status.lastFailure < this.cooldownMs) return true;
    if (!this.status.halfOpen) {
      this.status.halfOpen = true;
      logger.info("Circuit breaker HALF-OPEN", { label: this.label });
    }
    return false;
  }

  private async callUnsafe<T>(fn: () => Promise<T>): Promise<CircuitResult<T>> {
    const now = Date.now();
    if (this.shouldReject(now)) return { allowed: false };

    try {
      const result = await fn();
      this.reset();
      return { allowed: true, result };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.status.failures++;
      this.status.lastFailure = now;
      this.status.halfOpen = false;
      logger.error("Circuit breaker failure", {
        label: this.label,
        failures: this.status.failures,
        error: error.message,
      });
      return { allowed: false, error };
    }
  }
}

class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();

  get(label: string): CircuitBreaker {
    const existing = this.breakers.get(label);
    if (existing) return existing;
    const cb = new CircuitBreaker(label);
    this.breakers.set(label, cb);
    return cb;
  }

  reset(label?: string): void {
    if (label) this.breakers.get(label)?.reset();
    else this.breakers.forEach((b) => b.reset());
  }

  states(): Record<string, CircuitState> {
    const result: Record<string, CircuitState> = {};
    for (const [k, b] of this.breakers) result[k] = b.state;
    return result;
  }

  remove(label: string): void {
    this.breakers.delete(label);
  }
}

export const breakerRegistry = new CircuitBreakerRegistry();

export async function withCircuit<T>(
  fn: () => Promise<T>,
  label = "llm",
): Promise<CircuitResult<T>> {
  return breakerRegistry.get(label).call(fn);
}

export function getCircuitState(label = "llm"): CircuitState {
  return breakerRegistry.get(label).state;
}

export function resetCircuit(label?: string): void {
  breakerRegistry.reset(label);
}
