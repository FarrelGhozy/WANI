import { wrapCustomerMessage, buildSystemPrompt } from "@/src/ai/prompts"
import { MessageModel } from "@/src/models/message"
import type { ChatMessage } from "@/src/types/ai"
import type { PipelineStep } from "../types"

/**
 * Step 10 — Build system prompt and conversation history for the LLM.
 */
export const messageBuilderStep: PipelineStep = {
  name: "build_messages",
  async run(ctx) {
    const systemPrompt = buildSystemPrompt(
      ctx.storeInfo!,
      ctx.products!,
      ctx.aiConfig?.knowledgeBase ?? null,
      ctx.aiConfig?.systemPrompt ?? null,
    )
    ctx.systemPrompt = systemPrompt

    const recentMessages = await MessageModel.recentByConversation(ctx.conversationId!, 20)
    const historyMessages: ChatMessage[] = recentMessages
      .filter((m: any) => m.role !== "CUSTOMER" || m.content !== ctx.normalized)
      .slice(-10)
      .map((m: any) => ({
        role: m.role === "CUSTOMER" ? "user" : "assistant" as const,
        content: m.role === "CUSTOMER" ? wrapCustomerMessage(m.content) : m.content,
      }))
    ctx.historyMessages = historyMessages

    ctx.trace.set("history_count", historyMessages.length)
    return { kind: "continue" }
  },
}
