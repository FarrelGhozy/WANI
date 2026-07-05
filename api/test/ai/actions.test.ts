import { expect, test, describe } from "bun:test"
import type { ActionCtx } from "@/src/types/ai"

function makeCtx(overrides: Partial<ActionCtx> = {}): ActionCtx {
  return {
    ownerId: "test-owner",
    customerId: "test-cust",
    conversationId: "test-conv",
    storeInfo: { businessName: "Toko Test", phone: "62812", address: null, businessHours: null, paymentMethods: null, activePaymentMethods: [], shippingInfo: null, returnPolicy: null },
    products: [],
    greetingMessage: null,
    ...overrides,
  }
}

describe("handleIntent", () => {
  test("handles unknown intent directly", async () => {
    const { handleIntent } = await import("@/src/ai/actions")
    const output = { intent: "unknown" as const, reply: "Maaf, tidak mengerti" }
    const result = await handleIntent(output, makeCtx())
    expect(result.reply).toBe("Maaf, tidak mengerti")
  })

  test("handles greeting with custom message", async () => {
    const { handleIntent } = await import("@/src/ai/actions")
    const output = { intent: "greeting" as const, reply: "Halo!" }
    const result = await handleIntent(output, makeCtx({ greetingMessage: "Salam hangat dari Toko Test!" }))
    expect(result.reply).toBe("Salam hangat dari Toko Test!")
  })

  test("handles greeting fallback when no greeting message", async () => {
    const { handleIntent } = await import("@/src/ai/actions")
    const output = { intent: "greeting" as const, reply: "Halo!" }
    const result = await handleIntent(output, makeCtx())
    expect(result.reply).toBe("Halo! Ada yang bisa kami bantu?")
  })

  test("handles inquiry with reply", async () => {
    const { handleIntent } = await import("@/src/ai/actions")
    const output = { intent: "inquiry" as const, reply: "Harga nasi goreng Rp15.000" }
    const result = await handleIntent(output, makeCtx())
    expect(result.reply).toBe("Harga nasi goreng Rp15.000")
  })

  test("handles inquiry without reply", async () => {
    const { handleIntent } = await import("@/src/ai/actions")
    const output = { intent: "inquiry" as const, reply: "" }
    const result = await handleIntent(output, makeCtx())
    expect(result.reply).toBe("Maaf, bisa dijelaskan lebih detail pertanyaannya?")
  })
})
