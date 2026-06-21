import { prisma } from "@/src/config/db"
import { env } from "@/src/config/env"
import { logger } from "@/src/config/logger"
import type { TokenUsage } from "@/src/ai/types"

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
}

/** True when today's LLM call count has reached the configured daily budget. */
export async function isBudgetExceeded(): Promise<boolean> {
  const budget = env.guardrails.dailyLlmBudget
  if (budget <= 0) return false
  try {
    const row = await prisma.usageCounter.findUnique({ where: { id: todayKey() } })
    return (row?.llmCalls ?? 0) >= budget
  } catch (err) {
    // Fail open on counter read errors — don't take the bot down over telemetry.
    logger.error("budget check failed", { err })
    return false
  }
}

/** Increment today's usage counter after a successful LLM call. */
export async function recordLlmUsage(usage: TokenUsage): Promise<void> {
  const id = todayKey()
  try {
    await prisma.usageCounter.upsert({
      where: { id },
      create: {
        id,
        llmCalls: 1,
        tokensIn: usage.promptTokens,
        tokensOut: usage.completionTokens,
      },
      update: {
        llmCalls: { increment: 1 },
        tokensIn: { increment: usage.promptTokens },
        tokensOut: { increment: usage.completionTokens },
      },
    })
  } catch (err) {
    logger.error("failed to record llm usage", { err })
  }
}
