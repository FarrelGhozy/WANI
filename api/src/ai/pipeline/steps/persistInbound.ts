import { MessageModel } from "@/src/models/message"
import type { ClearedInput, Step } from "../types"
import { ok } from "../either"

export const persistInboundStep: Step<ClearedInput, ClearedInput> = {
  name: "persist_inbound",
  async run(input, _ctx) {
    await MessageModel.append({
      ownerId: input.ownerId,
      conversationId: input.conversationId,
      role: "CUSTOMER",
      content: input.normalized,
      waMsgId: input.waMsgId,
    })
    return ok(input)
  },
}
