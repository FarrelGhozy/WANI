import { MessageModel } from "@/models/message"
import { ConversationModel } from "@/models/conversation"
import wahaService from "@/services/waha"
import { logger } from "@/config/logger"
import type { PipelineResult } from "@/types/ai"
import type { GuardedInput, Step } from "../types"
import { ok } from "../either"

/**
 * Persist the bot reply, then push it to the customer through the owner's
 * WAHA session. The push is fail-open: the reply stays persisted (visible in
 * dashboard history) even when WAHA is down, and the error is only logged.
 */
export const outboundPersisterStep: Step<GuardedInput, PipelineResult> = {
  name: "persist_outbound",
  async run(input, _ctx) {
    const msg = await MessageModel.append({
      ownerId: input.ownerId,
      conversationId: input.conversationId,
      role: "BOT",
      content: input.finalReply,
    })
    await ConversationModel.touch(input.conversationId)

    if (input.customerPhone && input.finalReply) {
      try {
        const sent = await wahaService.sendText(input.ownerId, input.customerPhone, input.finalReply)
        if (sent) await MessageModel.markSent(msg.id, sent.messageId)
      } catch (err) {
        logger.error("outbound push via WAHA failed", {
          conversationId: input.conversationId,
          ownerId: input.ownerId,
          err: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return ok({
      reply: input.finalReply,
      intent: input.llmIntent,
      blocked: false,
      qrisImageUrl: input.qrisImageUrl,
    })
  },
}
