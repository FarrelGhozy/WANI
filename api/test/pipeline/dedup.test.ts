import { expect, test, describe } from "bun:test"
import { dedupStep } from "@/src/ai/pipeline/steps/dedup"
import type { PipelineContext } from "@/src/ai/pipeline/types"

function makeCtx(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    input: { phone: "62812", text: "halo" },
    trace: { set: () => null as any, begin: () => null as any } as any,
    customerId: "cust-1",
    conversationId: "conv-1",
    ...overrides,
  }
}

describe("dedupStep", () => {
  test("continues when no waMsgId provided", async () => {
    const ctx = makeCtx()
    const result = await dedupStep.run(ctx)
    expect(result.kind).toBe("continue")
  })
})
