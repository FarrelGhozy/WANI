import { MessageModel } from "@/src/models/message"
import type { PipelineStep } from "../types"

/**
 * Step 4 — Persist the inbound customer message.
 */
export const persistInboundStep: PipelineStep = {
  name: "persist_inbound",
  async run(ctx) {
    await MessageModel.append({
      conversationId: ctx.conversationId!,
      role: "CUSTOMER",
      content: ctx.normalized!,
      waMsgId: ctx.input.waMsgId,
    })
    return { kind: "continue" }
  },
}
