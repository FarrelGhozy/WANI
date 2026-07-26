import { checkRateLimit } from "@/guardrails/ratelimit";
import { MessageModel } from "@/models/message";
import { STEP_REPLIES, type PipelineStep } from "../types";

/**
 * Step 5 — Sliding-window rate limit per customer.
 */
export const rateLimitStep: PipelineStep = {
  name: "rate_limit",
  async run(ctx) {
    const rate = checkRateLimit(ctx.customerId!);
    if (!rate.allowed) {
      if (rate.notify) {
        await MessageModel.append({
          ownerId: ctx.ownerId,
          conversationId: ctx.conversationId!,
          role: "BOT",
          content: STEP_REPLIES.RATE_LIMIT,
        });
      }
      return {
        kind: "break",
        result: {
          reply: STEP_REPLIES.RATE_LIMIT,
          intent: "rate_limited",
          blocked: true,
          qrisImageUrl: null,
        },
      };
    }
    return { kind: "continue" };
  },
};
