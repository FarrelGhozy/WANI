import { env } from "@/src/config/env"

interface Bucket {
  short: number[]
  long: number[]
  // Suppress repeated "please wait" notices until this timestamp.
  notifiedUntil: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  // True only on the transition into a blocked state, so the caller sends the
  // soft "please wait" reply at most once per short window.
  notify: boolean
}

/**
 * Per-customer flood control using two in-memory sliding windows.
 * In-memory is sufficient: the api runs as a single process.
 */
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now()
  const { rateShortMax, rateShortWindowMs, rateLongMax, rateLongWindowMs } = env.guardrails

  const b = buckets.get(key) ?? { short: [], long: [], notifiedUntil: 0 }
  b.short = b.short.filter((t) => now - t < rateShortWindowMs)
  b.long = b.long.filter((t) => now - t < rateLongWindowMs)

  const blocked = b.short.length >= rateShortMax || b.long.length >= rateLongMax
  if (blocked) {
    const notify = now > b.notifiedUntil
    if (notify) b.notifiedUntil = now + rateShortWindowMs
    buckets.set(key, b)
    return { allowed: false, notify }
  }

  b.short.push(now)
  b.long.push(now)
  buckets.set(key, b)
  return { allowed: true, notify: false }
}

/** Test helper — clears all in-memory rate state. */
export function resetRateLimits(): void {
  buckets.clear()
}
