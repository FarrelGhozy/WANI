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

  test("creates error for server error", () => {
    const err = new LLMError("server error", true)
    expect(err.message).toBe("server error")
    expect(err.retryable).toBe(true)
  })
})
