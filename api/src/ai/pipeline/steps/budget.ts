import { isBudgetExceeded } from "@/src/guardrails/budget"
import { ActivityLogModel } from "@/src/models/activity-log"
import { STEP_REPLIES, type PipelineStep } from "../types"

/**
 * Step 8 — Check if daily LLM budget has been exceeded.
 */
export const budgetStep: PipelineStep = {
  name: "budget_check",
  async run(ctx) {
    if (await isBudgetExceeded()) {
      await ActivityLogModel.log(ctx.ownerId, "budget_exceeded", "Daily LLM budget exceeded", ctx.conversationId!)
      return {
        kind: "break",
        result: {
          reply: STEP_REPLIES.BUDGET,
          intent: "budget_exceeded",
          blocked: true,
          qrisImageUrl: null,
        },
      }
    }
    return { kind: "continue" }
  },
}
