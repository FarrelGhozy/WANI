import { checkRateLimit } from "@/src/guardrails/ratelimit"
import { MessageModel } from "@/src/models/message"
import { STEP_REPLIES, type ClearedInput, type Step } from "../types"
import { ok, fail } from "../either"

export const rateLimitStep: Step<ClearedInput, ClearedInput> = {
  name: "rate_limit",
  async run(input, _ctx) {
    const rate = checkRateLimit(input.customerId)
    if (!rate.allowed) {
      if (rate.notify) {
        await MessageModel.append({
          ownerId: input.ownerId,
          conversationId: input.conversationId,
          role: "BOT",
          content: STEP_REPLIES.RATE_LIMIT,
        })
      }
      return fail({ type: "short_circuit", reply: STEP_REPLIES.RATE_LIMIT, intent: "rate_limited" })
    }
    return ok(input)
  },
}
