// ─── Layer 3: Conversation context analysis ──────────────────────────────

import { scanInput } from "@/src/guardrails/firewall/injection"
import { detectObfuscation } from "@/src/guardrails/firewall/encoding"
import { logger } from "@/src/config/logger"
import type { ScanResult } from "@/src/guardrails/firewall/types"

interface ConversationState {
  identityChallenges: number
  suspiciousScore: number
  lastNTurns: Array<{ text: string; score: number }>
  lastAccess: number
}

const convMemory = new Map<string, ConversationState>()

// Periodic cleanup to prevent Map leak — runs every 10 minutes.
const CLEANUP_INTERVAL_MS = 600_000
const MAX_IDLE_MS = 30 * 60 * 1000 // 30 minutes
setInterval(() => {
  const cutoff = Date.now() - MAX_IDLE_MS
  for (const [key, state] of convMemory) {
    if (state.lastAccess < cutoff) convMemory.delete(key)
  }
}, CLEANUP_INTERVAL_MS).unref()

export function resetConversationState(key: string): void {
  convMemory.delete(key)
}

/**
 * Rate a single turn for suspiciousness (0–100).
 * Tracks cumulative drift — high scores over multiple turns = persona erosion.
 */
export function analyzeTurn(key: string, text: string): ScanResult {
  let state = convMemory.get(key)
  if (!state) {
    state = { identityChallenges: 0, suspiciousScore: 0, lastNTurns: [], lastAccess: Date.now() }
    convMemory.set(key, state)
  }

  state.lastAccess = Date.now()
  const result = scanInput(text)
  let turnScore = 0

  if (result.blocked) turnScore += 50
  if (detectObfuscation(text)) turnScore += 30
  if (text.length > 500) turnScore += 5

  const challengeCount = (text.match(/(?:siapa|who\s+are|what\s+are\s+you|your\s+name)/gi) || []).length
  if (challengeCount > 0) {
    state.identityChallenges += challengeCount
    turnScore += challengeCount * 10
  }

  state.lastNTurns.push({ text, score: turnScore })
  if (state.lastNTurns.length > 10) state.lastNTurns.shift()

  const recentScores = state.lastNTurns.map((t) => t.score)
  const drift = recentScores.length >= 3
    ? recentScores.slice(-3).reduce((a, b) => a + b, 0) / 3
    : 0

  state.suspiciousScore = drift

  if (result.blocked) {
    logger.warn("Firewall blocked turn", {
      key,
      reasons: result.reasons,
      turnScore,
      cumulativeDrift: drift,
    })
  }

  return result
}
