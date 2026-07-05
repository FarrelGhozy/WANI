import { expect, test, describe, mock } from "bun:test"
import { dedupStep } from "@/src/ai/pipeline/steps/dedup"
import { MessageModel } from "@/src/models/message"
import type { PipelineContext } from "@/src/ai/pipeline/types"

function makeCtx(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    ownerId: "test",
    input: { ownerId: "test", phone: "62812", text: "halo" },
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

  test("continues when waMsgId does not exist in DB", async () => {
    mock.module("@/src/models/message", () => ({
      MessageModel: {
        existsByWaMsgId: async () => false,
      },
    }))
    const ctx = makeCtx({ input: { ownerId: "test", phone: "62812", text: "halo", waMsgId: "new-msg-1" } })
    const result = await dedupStep.run(ctx)
    expect(result.kind).toBe("continue")
  })

  test("breaks with duplicate intent when waMsgId already exists", async () => {
    mock.module("@/src/models/message", () => ({
      MessageModel: {
        existsByWaMsgId: async () => true,
      },
    }))
    const ctx = makeCtx({ input: { ownerId: "test", phone: "62812", text: "halo", waMsgId: "dup-msg-1" } })
    const result = await dedupStep.run(ctx)
    expect(result.kind).toBe("break")
    if (result.kind === "break") {
      expect(result.result.intent).toBe("duplicate")
      expect(result.result.blocked).toBe(true)
    }
  })
})
