import { normalizeInput } from "@/src/guardrails/input"
import { checkRateLimit } from "@/src/guardrails/ratelimit"
import { isBudgetExceeded, recordLlmUsage } from "@/src/guardrails/budget"
import { sanitizeReply } from "@/src/guardrails/output"
import { analyzeTurn, classifyVerdict, scanOutput } from "@/src/guardrails/firewall"
import { scanPii, hasPii } from "@/src/guardrails/pii"
import { classifyInput, judgeInput, checkGrounding } from "@/src/guardrails/classifier"
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

async function blockReply(convId: string, reply: string, intent: string): Promise<PipelineResult> {
  await MessageModel.append({ conversationId: convId, role: "BOT", content: reply })
  return { reply, intent, blocked: true }
}

export async function processMessage(input: PipelineInput): Promise<PipelineResult> {
  // ── 1. Normalize input ──────────────────────────────────────────────
  const normalized = normalizeInput(input.text)
  if (!normalized) {
    return { reply: "Maaf, pesan kosong. Silakan ketik pesan Anda.", intent: "unknown", blocked: true }
  }

  // ── 2. Customer & conversation ──────────────────────────────────────
  const customer = await CustomerModel.upsertByPhone(input.phone, input.name)
  const conv = await ConversationModel.findOrCreateActive(customer.id)

  // ── 3. Dedup by waMsgId ─────────────────────────────────────────────
  if (input.waMsgId) {
    const exists = await MessageModel.existsByWaMsgId(input.waMsgId)
    if (exists) return { reply: "", intent: "duplicate", blocked: true }
  }

  // ── 4. Persist inbound message ──────────────────────────────────────
  await MessageModel.append({
    conversationId: conv.id,
    role: "CUSTOMER",
    content: normalized,
    waMsgId: input.waMsgId,
  })

  // ── 5. Rate limit ───────────────────────────────────────────────────
  const rate = checkRateLimit(customer.id)
  if (!rate.allowed) {
    if (rate.notify) {
      await MessageModel.append({ conversationId: conv.id, role: "BOT", content: RATE_LIMIT_REPLY })
    }
    return { reply: RATE_LIMIT_REPLY, intent: "rate_limited", blocked: true }
  }

  // ── 6. PII scan on input (log only) ─────────────────────────────────
  const piiMatches = scanPii(normalized)
  if (piiMatches.length > 0) {
    await ActivityLogModel.log("pii_detected", `PII detected in input: ${piiMatches.map((m) => m.type).join(", ")}`, conv.id, {
      piiTypes: piiMatches.map((m) => m.type),
    })
  }

  // ── 7. Firewall — 3-tier injection defense ──────────────────────────
  // Tier 1: Regex scan (fast path, runs always)
  const scanResult = analyzeTurn(customer.phone, normalized)
  const verdict = classifyVerdict(scanResult.reasons)

  if (verdict === "BLOCK") {
    await ActivityLogModel.log("injection_blocked", `Regex blocked: ${scanResult.reasons.join(", ")}`, conv.id, {
      text: normalized, reasons: scanResult.reasons, tier: 1,
    })
    return blockReply(conv.id, INJECTION_REPLY, "injection")
  }

  if (verdict === "UNCERTAIN") {
    // Tier 2: ML classifier (slow path, only when regex is uncertain)
    const classifierResult = await classifyInput(normalized)

    if (classifierResult.verdict === "INJECTION") {
      await ActivityLogModel.log("injection_blocked", `Classifier blocked: ${classifierResult.reasons.join(", ")}`, conv.id, {
        text: normalized, reasons: classifierResult.reasons, tier: 2,
      })
      return blockReply(conv.id, INJECTION_REPLY, "injection")
    }

    if (classifierResult.verdict === "SUSPICIOUS") {
      // Tier 3: Deep judge (slowest path, only when classifier is uncertain)
      const history = await MessageModel.recentByConversation(conv.id, 6)
      const historyTexts = history.map((m) => `${m.role}: ${m.content}`)

      const judgeResult = await judgeInput(normalized, classifierResult.reasons, historyTexts)

      if (judgeResult.verdict === "BLOCK") {
        await ActivityLogModel.log("injection_blocked", `Judge blocked: ${judgeResult.reasons.join(", ")}`, conv.id, {
          text: normalized, reasons: judgeResult.reasons, tier: 3,
        })
        return blockReply(conv.id, INJECTION_REPLY, "injection")
      }

      logger.info("Judge passed suspicious message", { reasons: judgeResult.reasons })
    }
  }

  // ── 8. Budget check ─────────────────────────────────────────────────
  if (await isBudgetExceeded()) {
    await ActivityLogModel.log("budget_exceeded", "Daily LLM budget exceeded", conv.id)
    return blockReply(conv.id, BUDGET_REPLY, "budget_exceeded")
  }

  // ── 9. Load context ─────────────────────────────────────────────────
  const store = await StoreModel.find()
  const products = await ProductModel.listAvailable()
  const aiConfig = await AiConfigModel.find()

  const isActive = aiConfig?.isActive ?? true
  if (!isActive) {
    return blockReply(conv.id, "Maaf, bot sedang tidak aktif. CS manusia akan segera membantu Anda.", "inactive")
  }

  const storeInfo = {
    businessName: store?.businessName ?? env.ai.defaultModel,
    phone: store?.phone ?? "",
    address: store?.address ?? null,
    businessHours: store?.businessHours ?? null,
    paymentMethods: store?.paymentMethods ?? null,
    shippingInfo: store?.shippingInfo ?? null,
    returnPolicy: store?.returnPolicy ?? null,
  }

  const systemPrompt = buildSystemPrompt(storeInfo, products, aiConfig?.knowledgeBase ?? null, aiConfig?.systemPrompt || null)

  // ── 10. Build messages with history ─────────────────────────────────
  const recentMessages = await MessageModel.recentByConversation(conv.id, 20)
  const historyMessages: ChatMessage[] = recentMessages
    .filter((m) => m.role !== "CUSTOMER" || m.content !== normalized)
    .slice(-10)
    .map((m) => ({
      role: m.role === "CUSTOMER" ? "user" : "assistant",
      content: m.role === "CUSTOMER" ? wrapCustomerMessage(m.content) : m.content,
    }))

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: wrapCustomerMessage(normalized) },
  ]

  // ── 11. LLM call via circuit breaker ────────────────────────────────
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
    return blockReply(conv.id, reply, "error")
  }

  const completion = cbResult.result!
  let raw = completion.content.trim()
  let llmOutput: LLMOutput

  // ── 12. Parse LLM output ────────────────────────────────────────────
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

  // ── 13. Execute intent action ───────────────────────────────────────
  const ctx = {
    customerId: customer.id,
    conversationId: conv.id,
    aiConfig: aiConfig ?? {} as any,
    greetingMessage: aiConfig?.greetingMessage,
  }

  const { reply: actionReply } = await handleIntent(llmOutput, ctx)

  // ── 14. Sanitize + output scan (Layer 4) ────────────────────────────
  let finalReply = sanitizeReply(actionReply)

  const outputResult = scanOutput(finalReply)
  if (outputResult.blocked) {
    finalReply = LEAK_FALLBACK
    await ActivityLogModel.log("output_blocked", `Output scan: ${outputResult.reason}`, conv.id, {
      reason: outputResult.reason, intent: llmOutput.intent,
    })
  }

  // ── 15. PII scan on output — redact if any leaked ───────────────────
  if (!outputResult.blocked && hasPii(finalReply)) {
    const piiFound = scanPii(finalReply)
    await ActivityLogModel.log("pii_output", `PII in outbound reply: ${piiFound.map((m) => m.type).join(", ")}`, conv.id, {
      piiTypes: piiFound.map((m) => m.type), intent: llmOutput.intent,
    })
    // Redact by replacing with type markers (reverse order to preserve indices)
    for (const m of piiFound.sort((a, b) => b.start - a.start)) {
      finalReply = finalReply.slice(0, m.start) + `[${m.type.toUpperCase()}]` + finalReply.slice(m.end)
    }
  }

  // ── 16. Grounding check (for inquiry/order intents) ─────────────────
  if (!outputResult.blocked && (llmOutput.intent === "inquiry" || llmOutput.intent === "order")) {
    const storeStr = [
      `Nama: ${storeInfo.businessName}`,
      `Alamat: ${storeInfo.address ?? "-"}`,
      `Jam: ${storeInfo.businessHours ?? "-"}`,
      `Pembayaran: ${storeInfo.paymentMethods ?? "-"}`,
      `Pengiriman: ${storeInfo.shippingInfo ?? "-"}`,
      `Retur: ${storeInfo.returnPolicy ?? "-"}`,
    ].join("\n")

    const productsStr = products
      .filter((p) => p.isAvailable)
      .map((p) => `- ${p.name}: Rp${p.price.toLocaleString("id-ID")} (stok: ${p.stock})`)
      .join("\n")

    const grounding = await checkGrounding(finalReply, normalized, storeStr, productsStr)

    if (!grounding.grounded) {
      await ActivityLogModel.log("grounding_failed", `Unsupported claims: ${grounding.unsupportedClaims.join(", ")}`, conv.id, {
        unsupportedClaims: grounding.unsupportedClaims, intent: llmOutput.intent,
      })
      // Replace reply with a safe version that doesn't hallucinate
      finalReply = "Maaf, ada informasi yang kurang tepat dari jawaban saya sebelumnya. " +
        "Bisa dicek kembali ya, atau hubungi CS kami untuk info lebih lanjut."
    }
  }

  // ── 17. Record usage ────────────────────────────────────────────────
  await recordLlmUsage(completion.usage)
  await ActivityLogModel.log("llm_call", `LLM call completed (${llmOutput.intent})`, conv.id, {
    intent: llmOutput.intent, model: completion.model, usage: completion.usage,
  })

  // ── 18. Persist outbound + touch ────────────────────────────────────
  await MessageModel.append({ conversationId: conv.id, role: "BOT", content: finalReply })
  await ConversationModel.touch(conv.id)

  return { reply: finalReply, intent: llmOutput.intent, blocked: false }
}
