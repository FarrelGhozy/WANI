import { expect, test, describe, mock, afterEach } from "bun:test"

const mockAppend = mock((data: any) => Promise.resolve({ id: "msg-123" }))
const mockMarkDelivered = mock((_id: string) => Promise.resolve())
const mockTouch = mock((_id: string) => Promise.resolve())

mock.module("@/src/models/message", () => ({
  MessageModel: {
    append: mockAppend,
    markDelivered: mockMarkDelivered,
  },
}))

mock.module("@/src/models/conversation", () => ({
  ConversationModel: {
    touch: mockTouch,
  },
}))

import { outboundPersisterStep } from "@/src/ai/pipeline/steps/outboundPersister"
import type { PipelineContext } from "@/src/ai/pipeline/types"

function makeCtx(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    input: { phone: "628123456789", text: "Halo" },
    conversationId: "conv-1",
    finalReply: "Halo juga! Ada yang bisa dibantu?",
    trace: { set: () => null as any, begin: () => null as any } as any,
    ...overrides,
  }
}

describe("outboundPersisterStep", () => {
  afterEach(() => {
    mockAppend.mockClear()
    mockMarkDelivered.mockClear()
    mockTouch.mockClear()
  })

  test("returns continue", async () => {
    const ctx = makeCtx()
    const result = await outboundPersisterStep.run(ctx)
    expect(result.kind).toBe("continue")
  })

  test("calls MessageModel.append with role BOT and finalReply", async () => {
    const ctx = makeCtx()
    await outboundPersisterStep.run(ctx)

    expect(mockAppend).toHaveBeenCalledTimes(1)
    expect(mockAppend).toHaveBeenCalledWith({
      conversationId: "conv-1",
      role: "BOT",
      content: "Halo juga! Ada yang bisa dibantu?",
    })
  })

  test("calls MessageModel.markDelivered with the returned id", async () => {
    const ctx = makeCtx()
    await outboundPersisterStep.run(ctx)

    expect(mockMarkDelivered).toHaveBeenCalledTimes(1)
    expect(mockMarkDelivered).toHaveBeenCalledWith("msg-123")
  })

  test("calls markDelivered with different id per call", async () => {
    mockAppend.mockImplementationOnce(() => Promise.resolve({ id: "msg-456" }))

    const ctx = makeCtx({ conversationId: "conv-2" })
    await outboundPersisterStep.run(ctx)

    expect(mockMarkDelivered).toHaveBeenCalledWith("msg-456")
  })

  test("calls ConversationModel.touch with conversationId", async () => {
    const ctx = makeCtx()
    await outboundPersisterStep.run(ctx)

    expect(mockTouch).toHaveBeenCalledTimes(1)
    expect(mockTouch).toHaveBeenCalledWith("conv-1")
  })

  test("all three calls happen in order: append → markDelivered → touch", async () => {
    const order: string[] = []
    mockAppend.mockImplementationOnce(async () => { order.push("append"); return { id: "m1" } })
    mockMarkDelivered.mockImplementationOnce(async () => { order.push("markDelivered") })
    mockTouch.mockImplementationOnce(async () => { order.push("touch") })

    await outboundPersisterStep.run(makeCtx())

    expect(order).toEqual(["append", "markDelivered", "touch"])
  })
})
