import { wrapCustomerMessage, buildSystemPrompt } from "@/ai/prompts"
import { MessageModel } from "@/models/message"
import type { ChatMessage } from "@/types/ai"
import type { EnrichedInput, PromptInput, Step } from "../types"
import { ok } from "../either"

export const messageBuilderStep: Step<EnrichedInput, PromptInput> = {
  name: "build_messages",
  async run(input, { trace }) {
    const systemPrompt = buildSystemPrompt(
      input.storeInfo,
      input.products,
      (input.aiConfig as any)?.knowledgeBase ?? null,
      (input.aiConfig as any)?.systemPrompt ?? null,
    )

    const recentMessages = await MessageModel.recentByConversation(input.conversationId, 20)
    const historyMessages: ChatMessage[] = recentMessages
      .filter((m: any) => m.role !== "CUSTOMER" || m.content !== input.normalized)
      .slice(-10)
      .map((m: any) => ({
        role: m.role === "CUSTOMER" ? "user" : "assistant" as const,
        content: m.role === "CUSTOMER" ? wrapCustomerMessage(m.content) : m.content,
      }))

    trace.set("history_count", historyMessages.length)

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
      systemPrompt,
      historyMessages,
    })
  },
}
