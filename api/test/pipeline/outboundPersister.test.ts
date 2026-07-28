import { expect, test, describe, mock, afterEach } from "bun:test"

const mockAppend = mock((data: any) => Promise.resolve({ id: "msg-123" }))
const mockMarkDelivered = mock((_id: string) => Promise.resolve())
const mockTouch = mock((_id: string) => Promise.resolve())

mock.module("@/models/message", () => ({
  MessageModel: {
    append: mockAppend,
    markDelivered: mockMarkDelivered,
  },
}))

mock.module("@/models/conversation", () => ({
  ConversationModel: {
    touch: mockTouch,
  },
}))

import { outboundPersisterStep } from "@/ai/pipeline/steps/outboundPersister"
import type { GuardedInput } from "@/ai/pipeline/types"
import { TraceContext } from "@/debug/tracer"

function makeInput(overrides: Partial<GuardedInput> = {}): GuardedInput {
  return {
    ownerId: "test",
    phone: "628123456789",
    text: "Halo",
    normalized: "halo",
    customerId: "cust-1",
    customerPhone: "628123456789",
    conversationId: "conv-1",
    storeInfo: { businessName: "Toko", phone: "62812" } as any,
    products: [],
    aiConfig: {},
    systemPrompt: "help",
    historyMessages: [],
    completion: { content: "hai", model: "gpt-4", finishReason: "stop", usage: { promptTokens: 10, completionTokens: 20 } },
    llmOutput: { intent: "greeting", reply: "Halo juga!" } as any,
    llmIntent: "greeting",
    actionReply: "Halo juga!",
    qrisImageUrl: null,
    finalReply: "Halo juga! Ada yang bisa dibantu?",
    ...overrides,
  }
}

function trace() { return new TraceContext("test") }

describe("outboundPersisterStep", () => {
  afterEach(() => {
    mockAppend.mockClear()
    mockMarkDelivered.mockClear()
    mockTouch.mockClear()
  })

  test("returns ok with PipelineResult", async () => {
    const result = await outboundPersisterStep.run(makeInput(), { trace: trace() })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.reply).toBe("Halo juga! Ada yang bisa dibantu?")
      expect(result.value.intent).toBe("greeting")
    }
  })

  test("calls MessageModel.append with role BOT and finalReply", async () => {
    await outboundPersisterStep.run(makeInput(), { trace: trace() })

    expect(mockAppend).toHaveBeenCalledTimes(1)
    expect(mockAppend).toHaveBeenCalledWith({
      ownerId: "test",
      conversationId: "conv-1",
      role: "BOT",
      content: "Halo juga! Ada yang bisa dibantu?",
    })
  })

  test("calls MessageModel.markDelivered with the returned id", async () => {
    await outboundPersisterStep.run(makeInput(), { trace: trace() })

    expect(mockMarkDelivered).toHaveBeenCalledTimes(1)
    expect(mockMarkDelivered).toHaveBeenCalledWith("msg-123")
  })

  test("calls markDelivered with different id per call", async () => {
    mockAppend.mockImplementationOnce(() => Promise.resolve({ id: "msg-456" }))

    await outboundPersisterStep.run(makeInput({ conversationId: "conv-2" }), { trace: trace() })

    expect(mockMarkDelivered).toHaveBeenCalledWith("msg-456")
  })

  test("calls ConversationModel.touch with conversationId", async () => {
    await outboundPersisterStep.run(makeInput(), { trace: trace() })

    expect(mockTouch).toHaveBeenCalledTimes(1)
    expect(mockTouch).toHaveBeenCalledWith("conv-1")
  })

  test("all three calls happen in order: append → markDelivered → touch", async () => {
    const order: string[] = []
    mockAppend.mockImplementationOnce(async () => { order.push("append"); return { id: "m1" } })
    mockMarkDelivered.mockImplementationOnce(async () => { order.push("markDelivered") })
    mockTouch.mockImplementationOnce(async () => { order.push("touch") })

    await outboundPersisterStep.run(makeInput(), { trace: trace() })

    expect(order).toEqual(["append", "markDelivered", "touch"])
  })
})
