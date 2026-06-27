import { handleIntent } from "@/src/ai/actions"
import type { PipelineStep } from "../types"

/**
 * Step 13 — Execute the intent action on the parsed LLM output.
 */
export const intentExecutorStep: PipelineStep = {
  name: "execute_intent",
  async run(ctx) {
    const ctxAction = {
      customerId: ctx.customerId!,
      conversationId: ctx.conversationId!,
      greetingMessage: ctx.aiConfig?.greetingMessage ?? null,
    }
    const actionResult = await handleIntent(ctx.llmOutput!, ctxAction)
    ctx.actionReply = actionResult.reply
    ctx.actionQrisUrl = actionResult.qrisImageUrl ?? null
    return { kind: "continue" }
  },
}
