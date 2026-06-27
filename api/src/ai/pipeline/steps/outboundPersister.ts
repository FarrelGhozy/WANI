import { MessageModel } from "@/src/models/message"
import { ConversationModel } from "@/src/models/conversation"
import type { PipelineStep } from "../types"

/**
 * Step 16 — Persist the bot reply and touch conversation timestamp.
 */
export const outboundPersisterStep: PipelineStep = {
  name: "persist_outbound",
  async run(ctx) {
    await MessageModel.append({
      conversationId: ctx.conversationId!,
      role: "BOT",
      content: ctx.finalReply!,
    })
    await ConversationModel.touch(ctx.conversationId!)
    return { kind: "continue" }
  },
}
