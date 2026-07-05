import { expect, test, describe } from "bun:test"
import { LLMError } from "@/src/ai/engine"

describe("LLMError", () => {
  test("creates retryable error", () => {
    const err = new LLMError("rate limited", true)
    expect(err.message).toBe("rate limited")
    expect(err.retryable).toBe(true)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe("LLMError")
  })

  test("creates non-retryable error", () => {
    const err = new LLMError("bad request", false)
    expect(err.retryable).toBe(false)
  })
})

const hasApiKey = !!(process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY)

describe("complete()", () => {
  test.skipIf(hasApiKey)("throws LLMError when no API key configured", async () => {
    // This test only runs when there's no API key configured
    // When an API key is present, the test is skipped
    const { complete } = await import("@/src/ai/engine")
    try {
      await complete([{ role: "user", content: "hi" }])
      expect.unreachable("should have thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(LLMError)
      if (err instanceof LLMError) {
        expect(err.message).toContain("API key")
      }
    }
  })
})
