import { MessageModel } from "@/models/message";
import { ConversationModel } from "@/models/conversation";
import wahaService from "@/services/waha";
import { logger } from "@/config/logger";
import type { PipelineStep } from "../types";

/**
 * Step 16 — Persist the bot reply and touch conversation timestamp,
 * then push the reply to the customer via WAHA.
 *
 * Push is fail-open: if WAHA fails, the reply stays persisted (visible
 * in dashboard history) and the error is logged — never thrown.
 */
export const outboundPersisterStep: PipelineStep = {
  name: "persist_outbound",
  async run(ctx) {
    const msg = await MessageModel.append({
      ownerId: ctx.ownerId,
      conversationId: ctx.conversationId!,
      role: "BOT",
      content: ctx.finalReply!,
    });
    await ConversationModel.touch(ctx.conversationId!);

    if (ctx.customerPhone && ctx.finalReply) {
      try {
        const sent = await wahaService.sendText(
          ctx.ownerId,
          ctx.customerPhone,
          ctx.finalReply
        );
        if (sent) await MessageModel.markSent(msg.id, sent.messageId);
      } catch (err) {
        logger.error("outbound push via WAHA failed", {
          conversationId: ctx.conversationId,
          ownerId: ctx.ownerId,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { kind: "continue" };
  },
};
