import { expect, test, describe } from "bun:test"
import { isBudgetExceeded, recordLlmUsage } from "@/src/guardrails/budget"

describe("budget", () => {
  test("isBudgetExceeded returns false when budget is 0 or negative", async () => {
    const result = await isBudgetExceeded()
    // env.guardrails.dailyLlmBudget default is 0 = unlimited
    expect(result).toBe(false)
  })

  test("recordLlmUsage does not throw with real Prisma", async () => {
    await recordLlmUsage({ promptTokens: 10, completionTokens: 5 })
    // If it doesn't throw, the upsert worked
    expect(true).toBe(true)
  })
})
