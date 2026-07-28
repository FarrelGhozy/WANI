import { expect, test, describe, mock } from "bun:test"
import { dedupStep } from "@/src/ai/pipeline/steps/dedup"
import { MessageModel } from "@/src/models/message"
import type { ClearedInput } from "@/src/ai/pipeline/types"
import { TraceContext } from "@/src/debug/tracer"

function makeInput(overrides: Partial<ClearedInput> = {}): ClearedInput {
  return {
    ownerId: "test",
    phone: "62812",
    text: "halo",
    normalized: "halo",
    customerId: "cust-1",
    customerPhone: "62812",
    conversationId: "conv-1",
    ...overrides,
  }
}

function trace() { return new TraceContext("test") }

describe("dedupStep", () => {
  test("continues when no waMsgId provided", async () => {
    const result = await dedupStep.run(makeInput(), { trace: trace() })
    expect(result.ok).toBe(true)
  })

  test("continues when waMsgId does not exist in DB", async () => {
    mock.module("@/src/models/message", () => ({
      MessageModel: {
        existsByWaMsgId: async () => false,
      },
    }))
    const result = await dedupStep.run(makeInput({ waMsgId: "new-msg-1" }), { trace: trace() })
    expect(result.ok).toBe(true)
  })

  test("breaks when waMsgId already exists", async () => {
    mock.module("@/src/models/message", () => ({
      MessageModel: {
        existsByWaMsgId: async () => true,
      },
    }))
    const result = await dedupStep.run(makeInput({ waMsgId: "dup-msg-1" }), { trace: trace() })
    expect(result.ok).toBe(false)
  })
})
