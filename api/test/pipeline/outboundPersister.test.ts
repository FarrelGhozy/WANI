import { expect, test, describe, mock, afterEach, beforeEach } from "bun:test";

const mockAppend = mock((data: any) => Promise.resolve({ id: "msg-123" }));
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
import type { PipelineContext } from "@/ai/pipeline/types";
import wahaService from "@/services/waha";

const mockSendText = mock(() =>
  Promise.resolve({ messageId: "waha-msg-1" })
);
const _originalSendText = wahaService.sendText.bind(wahaService);
beforeEach(() => {
  (wahaService as any).sendText = mockSendText;
});
afterEach(() => {
  (wahaService as any).sendText = _originalSendText;
});

function makeCtx(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    ownerId: "owner-1",
    input: { ownerId: "owner-1", phone: "628123456789", text: "Halo" },
    conversationId: "conv-1",
    customerPhone: "628123456789",
    finalReply: "Halo juga! Ada yang bisa dibantu?",
    trace: { set: () => null as any, begin: () => null as any } as any,
    ...overrides,
  } as PipelineContext;
}

describe("outboundPersisterStep", () => {
  afterEach(() => {
    [mockAppend, mockMarkSent, mockTouch, mockSendText].forEach((m) =>
      m.mockClear()
    );
  });

  test("returns continue", async () => {
    const result = await outboundPersisterStep.run(makeCtx());
    expect(result.kind).toBe("continue");
  });

  test("calls MessageModel.append with role BOT and finalReply", async () => {
    await outboundPersisterStep.run(makeCtx());

    expect(mockAppend).toHaveBeenCalledTimes(1);
    expect(mockAppend).toHaveBeenCalledWith({
      ownerId: "owner-1",
      conversationId: "conv-1",
      role: "BOT",
      content: "Halo juga! Ada yang bisa dibantu?",
    });
  });

  test("pushes reply via wahaService.sendText(ownerId, phone, reply)", async () => {
    await outboundPersisterStep.run(makeCtx());

    expect(mockSendText).toHaveBeenCalledTimes(1);
    expect(mockSendText).toHaveBeenCalledWith(
      "owner-1",
      "628123456789",
      "Halo juga! Ada yang bisa dibantu?"
    );
  });

  test("stamps real WAHA message id after successful push", async () => {
    await outboundPersisterStep.run(makeCtx());
    expect(mockMarkSent).toHaveBeenCalledWith("msg-123", "waha-msg-1");
  });

  test("fail-open: WAHA error is swallowed, reply stays persisted", async () => {
    mockSendText.mockImplementationOnce(() =>
      Promise.reject(new Error("WAHA down"))
    );

    const result = await outboundPersisterStep.run(makeCtx());

    expect(result.kind).toBe("continue");
    expect(mockAppend).toHaveBeenCalledTimes(1); // persisted first
    expect(mockMarkSent).not.toHaveBeenCalled();
  });

  test("skips push when customerPhone missing", async () => {
    await outboundPersisterStep.run(makeCtx({ customerPhone: undefined }));
    expect(mockSendText).not.toHaveBeenCalled();
  });

  test("calls ConversationModel.touch with conversationId", async () => {
    await outboundPersisterStep.run(makeCtx());
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

    await outboundPersisterStep.run(makeCtx());
    expect(order).toEqual(["append", "touch", "push"]);
  });
});
