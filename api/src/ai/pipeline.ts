import { normalizeInput, detectInjection } from "@/src/guardrails/input"
import { checkRateLimit } from "@/src/guardrails/ratelimit"
import { isBudgetExceeded, recordLlmUsage } from "@/src/guardrails/budget"
import { sanitizeReply, hasLeak } from "@/src/guardrails/output"
import { buildSystemPrompt, wrapCustomerMessage } from "@/src/ai/prompts"
import { chat } from "@/src/ai/engine"
import { LLMOutputSchema } from "@/src/ai/schemas"
import { withCircuit } from "@/src/ai/circuit-breaker"
import { handleIntent } from "@/src/ai/actions"
import { CustomerModel } from "@/src/models/customer"
import { ConversationModel } from "@/src/models/conversation"
import { MessageModel } from "@/src/models/message"
import { StoreModel } from "@/src/models/store"
import { AiConfigModel } from "@/src/models/ai-config"
import { ProductModel } from "@/src/models/catalog"
import { ActivityLogModel } from "@/src/models/activity-log"
import { logger } from "@/src/config/logger"
import { env } from "@/src/config/env"
import type { ChatMessage, LLMOutput } from "@/src/ai/types"

export interface PipelineInput {
  phone: string
  name?: string
  text: string
  waMsgId?: string
}

export interface PipelineResult {
  reply: string
  intent: string
  blocked: boolean
}

const FALLBACK_REPLY = "Maaf, sistem sedang sibuk. Silakan coba lagi sebentar ya."
const LEAK_FALLBACK = "Maaf, terjadi kesalahan teknis. Tim kami akan segera memperbaikinya."
const INJECTION_REPLY = "Maaf, pesan Anda tidak dapat diproses. Silakan kirim ulang dengan bahasa yang sopan."
const BUDGET_REPLY = "Maaf, lagi ramai. CS manusia akan segera membalas pesan Anda."
const RATE_LIMIT_REPLY = "Mohon tunggu sebentar, Anda terlalu cepat mengirim pesan."

export async function processMessage(input: PipelineInput): Promise<PipelineResult> {
  // 1. Normalize input
  const normalized = normalizeInput(input.text)
  if (!normalized) {
    return { reply: "Maaf, pesan kosong. Silakan ketik pesan Anda.", intent: "unknown", blocked: true }
  }

  // 2. Customer & conversation
  const customer = await CustomerModel.upsertByPhone(input.phone, input.name)
  const conv = await ConversationModel.findOrCreateActive(customer.id)

  // 3. Dedup by waMsgId
  if (input.waMsgId) {
    const exists = await MessageModel.existsByWaMsgId(input.waMsgId)
    if (exists) {
      return { reply: "", intent: "duplicate", blocked: true }
    }
  }

  // 4. Persist inbound message
  await MessageModel.append({
    conversationId: conv.id,
    role: "CUSTOMER",
    content: normalized,
    waMsgId: input.waMsgId,
  })

  // 5. Rate limit
  const rate = checkRateLimit(customer.id)
  if (!rate.allowed) {
    if (rate.notify) {
      await MessageModel.append({
        conversationId: conv.id,
        role: "BOT",
        content: RATE_LIMIT_REPLY,
      })
    }
    return { reply: RATE_LIMIT_REPLY, intent: "rate_limited", blocked: true }
  }

  // 6. Injection detection
  if (detectInjection(normalized)) {
    await ActivityLogModel.log("injection_blocked", "Prompt injection detected", conv.id, {
      text: normalized,
    })
    await MessageModel.append({
      conversationId: conv.id,
      role: "BOT",
      content: INJECTION_REPLY,
    })
    return { reply: INJECTION_REPLY, intent: "injection", blocked: true }
  }

  // 7. Budget check
  if (await isBudgetExceeded()) {
    await ActivityLogModel.log("budget_exceeded", "Daily LLM budget exceeded", conv.id)
    await MessageModel.append({
      conversationId: conv.id,
      role: "BOT",
      content: BUDGET_REPLY,
    })
    return { reply: BUDGET_REPLY, intent: "budget_exceeded", blocked: true }
  }

  // 8. Load context for system prompt
  const store = await StoreModel.find()
  const products = await ProductModel.listAvailable()
  const aiConfig = await AiConfigModel.find()

  const isActive = aiConfig?.isActive ?? true
  if (!isActive) {
    const reply = "Maaf, bot sedang tidak aktif. CS manusia akan segera membantu Anda."
    await MessageModel.append({ conversationId: conv.id, role: "BOT", content: reply })
    return { reply, intent: "inactive", blocked: true }
  }

  const storeInfo = {
    businessName: store?.businessName ?? env.ai.defaultModel,
    phone: store?.phone ?? "",
    address: store?.address,
    businessHours: store?.businessHours,
    paymentMethods: store?.paymentMethods,
    shippingInfo: store?.shippingInfo,
    returnPolicy: store?.returnPolicy,
  }

  const systemPrompt = buildSystemPrompt(
    storeInfo,
    products,
    aiConfig?.knowledgeBase ?? null,
    aiConfig?.systemPrompt || null,
  )

  // 9. Build messages array with conversation history
  const recentMessages = await MessageModel.recentByConversation(conv.id, 20)
  const historyMessages: ChatMessage[] = recentMessages
    .filter((m) => m.role !== "CUSTOMER" || m.content !== normalized)
    .slice(-10)
    .map((m) => ({
      role: m.role === "CUSTOMER" ? "user" : "assistant",
      content: m.role === "CUSTOMER"
        ? wrapCustomerMessage(m.content)
        : m.content,
    }))

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: wrapCustomerMessage(normalized) },
  ]

  // 10. Call LLM via circuit breaker
  const model = aiConfig?.model || env.ai.defaultModel
  const maxTokens = aiConfig?.maxTokens ?? env.ai.maxTokens

  const cbResult = await withCircuit(async () =>
    chat(systemPrompt, wrapCustomerMessage(normalized), {
      model,
      maxTokens,
      temperature: aiConfig ? Number(aiConfig.temperature) : env.ai.temperature,
      timeout: 30_000,
    }),
  )

  if (!cbResult.allowed) {
    const reply = FALLBACK_REPLY
    await ActivityLogModel.log("llm_failed", "LLM call failed (circuit breaker)", conv.id, {
      error: cbResult.error?.message,
    })
    await MessageModel.append({ conversationId: conv.id, role: "BOT", content: reply })
    return { reply, intent: "error", blocked: true }
  }

  const completion = cbResult.result!
  let raw = completion.content.trim()
  let llmOutput: LLMOutput

  // 11. Parse LLM output — try JSON extraction if raw parse fails
  try {
    const parsed = JSON.parse(raw)
    const validated = await LLMOutputSchema.safeParseAsync(parsed)
    if (validated.success) {
      llmOutput = validated.data
    } else {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const retry = await LLMOutputSchema.safeParseAsync(JSON.parse(jsonMatch[0]))
        if (retry.success) {
          llmOutput = retry.data
        } else {
          throw new Error("invalid output")
        }
      } else {
        throw new Error("no json found")
      }
    }
  } catch {
    llmOutput = { intent: "unknown", reply: "Maaf, bisa diulang lagi? Saya kurang paham." }
  }

  // 12. Execute intent action
  const ctx = {
    customerId: customer.id,
    conversationId: conv.id,
    aiConfig: aiConfig ?? {} as any,
    greetingMessage: aiConfig?.greetingMessage,
  }

  const { reply: actionReply } = await handleIntent(llmOutput, ctx)

  // 13. Sanitize + leak check
  let finalReply = sanitizeReply(actionReply)
  if (hasLeak(finalReply)) {
    finalReply = LEAK_FALLBACK
    await ActivityLogModel.log("leak_blocked", "Prompt leak detected in reply", conv.id, {
      intent: llmOutput.intent,
    })
  }

  // 14. Record usage
  await recordLlmUsage(completion.usage)
  await ActivityLogModel.log("llm_call", `LLM call completed (${llmOutput.intent})`, conv.id, {
    intent: llmOutput.intent,
    model: completion.model,
    usage: completion.usage,
  })

  // 15. Persist outbound message
  await MessageModel.append({
    conversationId: conv.id,
    role: "BOT",
    content: finalReply,
  })

  await ConversationModel.touch(conv.id)

  return { reply: finalReply, intent: llmOutput.intent, blocked: false }
}
