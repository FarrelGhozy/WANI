import { complete } from "@/src/ai/engine"
import { withCircuit } from "@/src/ai/circuit-breaker"
import { wrapCustomerMessage } from "@/src/ai/prompts"
import { ActivityLogModel } from "@/src/models/activity-log"
import { env } from "@/src/config/env"
import { STEP_REPLIES, type PipelineStep } from "../types"

/**
 * Step 11 — LLM call via circuit breaker.
 * Returns break if the circuit is open or the call fails.
 */
export const llmCallStep: PipelineStep = {
  name: "llm_call",
  async run(ctx) {
    const model = ctx.aiConfig?.model || env.ai.defaultModel
    const maxTokens = ctx.aiConfig?.maxTokens ?? env.ai.maxTokens

    const messages = [
      { role: "system" as const, content: ctx.systemPrompt! },
      ...(ctx.historyMessages ?? []),
      { role: "user" as const, content: wrapCustomerMessage(ctx.normalized!) },
    ]

    const cbResult = await withCircuit(async () =>
      complete(messages, {
        model,
        maxTokens,
        temperature: ctx.aiConfig ? Number(ctx.aiConfig.temperature) : env.ai.temperature,
        timeout: 30_000,
      }),
    )

    if (!cbResult.allowed) {
      await ActivityLogModel.log(
        ctx.ownerId,
        "llm_failed",
        "LLM call failed (circuit breaker)",
        ctx.conversationId!,
        { error: cbResult.error?.message },
      )
      ctx.trace.set("error", cbResult.error?.message)
      return {
        kind: "break",
        result: {
          reply: STEP_REPLIES.FALLBACK,
          intent: "error",
          blocked: true,
          qrisImageUrl: null,
        },
      }
    }

    const completion = cbResult.result!
    ctx.completion = completion
    ctx.trace
      .set("llm_model", completion.model)
      .set("llm_tokens", completion.usage)

    return { kind: "continue" }
  },
}
