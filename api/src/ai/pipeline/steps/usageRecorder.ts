import { recordLlmUsage } from "@/guardrails/budget"
import { ActivityLogModel } from "@/models/activity-log"
import type { GuardedInput, Step } from "../types"
import { ok } from "../either"

export const usageRecorderStep: Step<GuardedInput, GuardedInput> = {
  name: "record_usage",
  async run(input, _ctx) {
    await recordLlmUsage(input.completion.usage)
    await ActivityLogModel.log(input.ownerId, "llm_call", `LLM call completed (${input.llmIntent})`, input.conversationId, {
      intent: input.llmIntent,
      model: input.completion.model,
      usage: input.completion.usage,
    })

    return ok(input)
  },
}
