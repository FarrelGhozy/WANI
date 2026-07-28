import { complete } from "@/src/ai/engine"
import { withCircuit } from "@/src/ai/circuit-breaker"
import { wrapCustomerMessage } from "@/src/ai/prompts"
import { ActivityLogModel } from "@/src/models/activity-log"
import { env } from "@/src/config/env"
import { STEP_REPLIES, type PromptInput, type LlmInput, type Step } from "../types"
import { ok, fail } from "../either"

export const llmCallStep: Step<PromptInput, LlmInput> = {
  name: "llm_call",
  async run(input, { trace }) {
    const aiConfig = input.aiConfig as Record<string, any>
    const model = aiConfig.model || env.ai.defaultModel
    const maxTokens = aiConfig.maxTokens ?? env.ai.maxTokens

    const messages = [
      { role: "system" as const, content: input.systemPrompt },
      ...input.historyMessages,
      { role: "user" as const, content: wrapCustomerMessage(input.normalized) },
    ]

    const cbResult = await withCircuit(async () =>
      complete(messages, {
        model,
        maxTokens,
        temperature: aiConfig.temperature ? Number(aiConfig.temperature) : env.ai.temperature,
        baseUrl: aiConfig.llmBaseUrl || undefined,
        apiKey: aiConfig.llmApiKey || undefined,
        fallbackModel: aiConfig.fallbackModel || undefined,
        timeout: 30_000,
      }),
    )

    if (!cbResult.allowed) {
      await ActivityLogModel.log(
        input.ownerId,
        "llm_failed",
        "LLM call failed (circuit breaker)",
        input.conversationId,
        { error: cbResult.error?.message },
      )
      trace.set("error", cbResult.error?.message)
      return fail({ type: "short_circuit", reply: STEP_REPLIES.FALLBACK, intent: "error" })
    }

    const completion = cbResult.result!
    trace.set("llm_model", completion.model).set("llm_tokens", completion.usage)

    return ok({
      ownerId: input.ownerId,
      phone: input.phone,
      name: input.name,
      waMsgId: input.waMsgId,
      text: input.text,
      normalized: input.normalized,
      customerId: input.customerId,
      customerPhone: input.customerPhone,
      conversationId: input.conversationId,
      storeInfo: input.storeInfo,
      products: input.products,
      aiConfig: input.aiConfig,
      systemPrompt: input.systemPrompt,
      historyMessages: input.historyMessages,
      completion,
    })
  },
}
