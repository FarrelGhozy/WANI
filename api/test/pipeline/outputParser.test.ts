import { expect, test, describe } from "bun:test"
import { outputParserStep } from "@/src/ai/pipeline/steps/outputParser"
import type { LlmInput } from "@/src/ai/pipeline/types"
import { TraceContext } from "@/src/debug/tracer"

function makeInput(raw: string): LlmInput {
  return {
    ownerId: "test",
    phone: "62812",
    text: "halo",
    normalized: "halo",
    customerId: "cust-1",
    customerPhone: "62812",
    conversationId: "conv-1",
    storeInfo: { businessName: "Toko", phone: "62812" } as any,
    products: [],
    aiConfig: {},
    systemPrompt: "help",
    historyMessages: [],
    completion: { content: raw, model: "gpt-4", finishReason: "stop", usage: { promptTokens: 10, completionTokens: 20 } },
  }
}

function trace() { return new TraceContext("test") }

const REPLY = "Halo juga!"

describe("outputParserStep", () => {
  test("parses valid greeting JSON", async () => {
    const result = await outputParserStep.run(makeInput(JSON.stringify({ intent: "greeting", reply: REPLY })), { trace: trace() })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.llmIntent).toBe("greeting")
    }
  })

  test("parses valid order JSON", async () => {
    const raw = JSON.stringify({
      intent: "order",
      items: [{ productId: "p1", name: "Nasi Goreng", qty: 2 }],
      notes: "Pedas",
    })
    const result = await outputParserStep.run(makeInput(raw), { trace: trace() })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.llmIntent).toBe("order")
    }
  })

  test("falls back to JSON extraction from non-JSON text", async () => {
    const json = JSON.stringify({ intent: "greeting", reply: REPLY })
    const result = await outputParserStep.run(makeInput(`Here's my response: ${json}`), { trace: trace() })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.llmIntent).toBe("greeting")
    }
  })
})
