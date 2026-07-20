import { isBudgetExceeded } from "@/src/guardrails/budget"
import { ActivityLogModel } from "@/src/models/activity-log"
import { STEP_REPLIES, type ClearedInput, type Step } from "../types"
import { ok, fail } from "../either"

export const budgetStep: Step<ClearedInput, ClearedInput> = {
  name: "budget_check",
  async run(input, _ctx) {
    if (await isBudgetExceeded()) {
      await ActivityLogModel.log(input.ownerId, "budget_exceeded", "Daily LLM budget exceeded", input.conversationId)
      return fail({ type: "short_circuit", reply: STEP_REPLIES.BUDGET, intent: "budget_exceeded" })
    }
    return ok(input)
  },
}
