import { expect, test, describe } from "bun:test"
import { outputParserStep } from "@/src/ai/pipeline/steps/outputParser"
import type { PipelineContext } from "@/src/ai/pipeline/types"

function makeCtx(raw: string): PipelineContext {
  return {
    input: { phone: "62812", text: "halo" },
    trace: { set: () => null as any, begin: () => null as any } as any,
    completion: { content: raw, model: "gpt-4", finishReason: "stop", usage: { promptTokens: 10, completionTokens: 20 } },
  }
}

const REPLY = "Halo juga!"

describe("outputParserStep", () => {
  test("parses valid greeting JSON", async () => {
    const ctx = makeCtx(JSON.stringify({ intent: "greeting", reply: REPLY }))
    const result = await outputParserStep.run(ctx)
    expect(result.kind).toBe("continue")
    expect(ctx.llmOutput?.intent).toBe("greeting")
    expect(ctx.llmOutput).toHaveProperty("reply")
    if (ctx.llmOutput && "reply" in ctx.llmOutput) {
      expect(ctx.llmOutput.reply).toBe(REPLY)
    }
    expect(ctx.llmIntent).toBe("greeting")
  })

  test("parses valid order JSON", async () => {
    const raw = JSON.stringify({
      intent: "order",
      items: [{ productId: "p1", name: "Nasi Goreng", qty: 2 }],
      notes: "Pedas",
    })
    const ctx = makeCtx(raw)
    const result = await outputParserStep.run(ctx)
    expect(result.kind).toBe("continue")
    expect(ctx.llmOutput?.intent).toBe("order")
    expect(ctx.llmIntent).toBe("order")
  })

  test("falls back to JSON extraction from non-JSON text", async () => {
    const json = JSON.stringify({ intent: "greeting", reply: REPLY })
    const raw = `Here's my response: ${json}`
    const ctx = makeCtx(raw)
    const result = await outputParserStep.run(ctx)
    expect(result.kind).toBe("continue")
    expect(ctx.llmOutput?.intent).toBe("greeting")
  })
})
