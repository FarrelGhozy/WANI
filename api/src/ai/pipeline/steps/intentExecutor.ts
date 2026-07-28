import { handleIntent } from "@/src/ai/actions"
import type { ParsedInput, ActionInput, Step } from "../types"
import { ok } from "../either"

export const intentExecutorStep: Step<ParsedInput, ActionInput> = {
  name: "execute_intent",
  async run(input, _ctx) {
    const ctxAction = {
      ownerId: input.ownerId,
      customerId: input.customerId,
      conversationId: input.conversationId,
      greetingMessage: (input.aiConfig as Record<string, any>)?.greetingMessage ?? null,
    }
    const actionResult = await handleIntent(input.llmOutput, ctxAction)

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
      completion: input.completion,
      llmOutput: input.llmOutput,
      llmIntent: input.llmIntent,
      actionReply: actionResult.reply,
      qrisImageUrl: actionResult.qrisImageUrl ?? null,
    })
  },
}
