import { MessageModel } from "@/src/models/message"
import { ConversationModel } from "@/src/models/conversation"
import type { PipelineResult } from "@/src/types/ai"
import type { GuardedInput, Step } from "../types"
import { ok } from "../either"

export const outboundPersisterStep: Step<GuardedInput, PipelineResult> = {
  name: "persist_outbound",
  async run(input, _ctx) {
    const msg = await MessageModel.append({
      ownerId: input.ownerId,
      conversationId: input.conversationId,
      role: "BOT",
      content: input.finalReply,
    })
    await MessageModel.markDelivered(msg.id)
    await ConversationModel.touch(input.conversationId)

    return ok({
      reply: input.finalReply,
      intent: input.llmIntent,
      blocked: false,
      qrisImageUrl: input.qrisImageUrl,
    })
  },
}
