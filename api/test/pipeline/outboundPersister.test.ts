import { expect, test, describe, mock, afterEach, beforeEach } from "bun:test";

const mockAppend = mock((_data: any) => Promise.resolve({ id: "msg-123" }));
const mockMarkSent = mock((_id: string, _waMsgId: string) => Promise.resolve());
const mockTouch = mock((_id: string) => Promise.resolve());

mock.module("@/models/message", () => ({
  MessageModel: {
    append: mockAppend,
    markSent: mockMarkSent,
  },
}));

mock.module("@/models/conversation", () => ({
  ConversationModel: {
    touch: mockTouch,
  },
}));

import { outboundPersisterStep } from "@/ai/pipeline/steps/outboundPersister";
import type { GuardedInput } from "@/ai/pipeline/types";
import wahaService from "@/services/waha";

const mockSendText = mock(() => Promise.resolve({ messageId: "waha-msg-1" }));
const _originalSendText = wahaService.sendText.bind(wahaService);
beforeEach(() => {
  (wahaService as any).sendText = mockSendText;
});
afterEach(() => {
  (wahaService as any).sendText = _originalSendText;
});

const traceCtx = {
  trace: {
    set: () => null,
    begin: () => null,
  } as any,
};

function makeInput(overrides: Partial<GuardedInput> = {}): GuardedInput {
  return {
    ownerId: "owner-1",
    phone: "628123456789",
    text: "Halo",
    normalized: "halo",
    customerId: "customer-1",
    customerPhone: "628123456789",
    conversationId: "conv-1",
    storeInfo: {} as any,
    products: [],
    aiConfig: {},
    systemPrompt: "",
    historyMessages: [],
    completion: {} as any,
    llmOutput: { intent: "greeting", reply: "" } as any,
    llmIntent: "greeting",
    actionReply: "",
    qrisImageUrl: null,
    finalReply: "Halo juga! Ada yang bisa dibantu?",
    ...overrides,
  } as GuardedInput;
}

describe("outboundPersisterStep", () => {
  afterEach(() => {
    [mockAppend, mockMarkSent, mockTouch, mockSendText].forEach((m) =>
      m.mockClear()
    );
  });

  test("returns the final pipeline result", async () => {
    const result = await outboundPersisterStep.run(makeInput(), traceCtx as any);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        reply: "Halo juga! Ada yang bisa dibantu?",
        intent: "greeting",
        blocked: false,
        qrisImageUrl: null,
      });
    }
  });

  test("calls MessageModel.append with role BOT and finalReply", async () => {
    await outboundPersisterStep.run(makeInput(), traceCtx as any);

    expect(mockAppend).toHaveBeenCalledTimes(1);
    expect(mockAppend).toHaveBeenCalledWith({
      ownerId: "owner-1",
      conversationId: "conv-1",
      role: "BOT",
      content: "Halo juga! Ada yang bisa dibantu?",
    });
  });

  test("pushes reply via wahaService.sendText(ownerId, phone, reply)", async () => {
    await outboundPersisterStep.run(makeInput(), traceCtx as any);

    expect(mockSendText).toHaveBeenCalledTimes(1);
    expect(mockSendText).toHaveBeenCalledWith(
      "owner-1",
      "628123456789",
      "Halo juga! Ada yang bisa dibantu?"
    );
  });

  test("stamps real WAHA message id after successful push", async () => {
    await outboundPersisterStep.run(makeInput(), traceCtx as any);
    expect(mockMarkSent).toHaveBeenCalledWith("msg-123", "waha-msg-1");
  });

  test("fail-open: WAHA error is swallowed, reply stays persisted", async () => {
    mockSendText.mockImplementationOnce(() =>
      Promise.reject(new Error("WAHA down"))
    );

    const result = await outboundPersisterStep.run(makeInput(), traceCtx as any);

    expect(result.ok).toBe(true);
    expect(mockAppend).toHaveBeenCalledTimes(1); // persisted first
    expect(mockMarkSent).not.toHaveBeenCalled();
  });

  test("skips push when customerPhone missing", async () => {
    await outboundPersisterStep.run(
      makeInput({ customerPhone: undefined }),
      traceCtx as any
    );
    expect(mockSendText).not.toHaveBeenCalled();
  });

  test("calls ConversationModel.touch with conversationId", async () => {
    await outboundPersisterStep.run(makeInput(), traceCtx as any);
    expect(mockTouch).toHaveBeenCalledTimes(1);
    expect(mockTouch).toHaveBeenCalledWith("conv-1");
  });

  test("order: append → touch → push", async () => {
    const order: string[] = [];
    mockAppend.mockImplementationOnce(async () => {
      order.push("append");
      return { id: "m1" };
    });
    mockTouch.mockImplementationOnce(async () => {
      order.push("touch");
    });
    mockSendText.mockImplementationOnce(async () => {
      order.push("push");
      return { messageId: "w1" };
    });

    await outboundPersisterStep.run(makeInput(), traceCtx as any);
    expect(order).toEqual(["append", "touch", "push"]);
  });
});
