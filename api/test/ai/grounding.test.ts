import { expect, test, describe } from "bun:test"

const groundingEnabled = process.env.GROUNDING_CHECK_ENABLED === "true"

describe("checkGrounding", () => {
  test.skipIf(groundingEnabled)("returns grounded=true when grounding is disabled", async () => {
    const { checkGrounding } = await import("@/src/guardrails/classifier")
    const result = await checkGrounding("Bot reply", "Customer message", "Store info", "Product list")
    expect(result.grounded).toBe(true)
    expect(result.unsupportedClaims).toEqual([])
  })
})
