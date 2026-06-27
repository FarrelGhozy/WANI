import { recordLlmUsage } from "@/src/guardrails/budget"
import { ActivityLogModel } from "@/src/models/activity-log"
import type { PipelineStep } from "../types"

/**
 * Step 15 — Record LLM token usage and log the successful call.
 */
export const usageRecorderStep: PipelineStep = {
  name: "record_usage",
  async run(ctx) {
    await recordLlmUsage(ctx.completion!.usage)
    await ActivityLogModel.log("llm_call", `LLM call completed (${ctx.llmIntent})`, ctx.conversationId!, {
      intent: ctx.llmIntent,
      model: ctx.completion!.model,
      usage: ctx.completion!.usage,
    })
    return { kind: "continue" }
  },
}
