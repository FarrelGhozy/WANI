import { normalizeInput } from "@/src/guardrails/input"
import { checkRateLimit } from "@/src/guardrails/ratelimit"
import { isBudgetExceeded, recordLlmUsage } from "@/src/guardrails/budget"
import { sanitizeReply } from "@/src/guardrails/output"
import { analyzeTurn, classifyVerdict, scanOutput } from "@/src/guardrails/firewall"
import { scanPii } from "@/src/guardrails/pii"
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
import { StorePaymentMethodModel } from "@/src/models/store-payment"
import { AiConfigModel } from "@/src/models/ai-config"
import { ProductModel } from "@/src/models/catalog"
import { ActivityLogModel } from "@/src/models/activity-log"
import { logger } from "@/src/config/logger"
import { env } from "@/src/config/env"
import { TraceContext, storeTrace } from "@/src/debug/tracer"
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
  qrisImageUrl?: string | null
}

const FALLBACK_REPLY = "Maaf, sistem sedang sibuk. Silakan coba lagi sebentar ya."
const LEAK_FALLBACK = "Maaf, terjadi kesalahan teknis. Tim kami akan segera memperbaikinya."
const INJECTION_REPLY = "Maaf, pesan Anda tidak dapat diproses. Silakan kirim ulang dengan bahasa yang sopan."
const BUDGET_REPLY = "Maaf, lagi ramai. CS manusia akan segera membalas pesan Anda."
const RATE_LIMIT_REPLY = "Mohon tunggu sebentar, Anda terlalu cepat mengirim pesan."

async function blockReply(convId: string, reply: string, intent: string, trace?: TraceContext): Promise<PipelineResult> {
  await MessageModel.append({ conversationId: convId, role: "BOT", content: reply })
  const result: PipelineResult = { reply, intent, blocked: true }
  if (trace) { trace.finish(result); storeTrace(trace) }
  return result
}

export async function processMessage(input: PipelineInput): Promise<PipelineResult> {
  const trace = new TraceContext(input.phone)

  // ── 1. Normalize input ──────────────────────────────────────────────
  trace.begin("normalize")
  const normalized = normalizeInput(input.text)
  if (!normalized) {
    const result: PipelineResult = { reply: "Maaf, pesan kosong. Silakan ketik pesan Anda.", intent: "unknown", blocked: true }
    trace.set("reason", "empty_input").finish(result); storeTrace(trace)
    return result
  }
  trace.set("input_length", normalized.length)

  // ── 2. Customer & conversation ──────────────────────────────────────
  trace.begin("customer_upsert")
  const customer = await CustomerModel.upsertByPhone(input.phone, input.name)
  const conv = await ConversationModel.findOrCreateActive(customer.id)
  trace.set("customer_id", customer.id).set("conversation_id", conv.id)

  // ── 3. Dedup by waMsgId ─────────────────────────────────────────────
  trace.begin("dedup")
  if (input.waMsgId) {
    const exists = await MessageModel.existsByWaMsgId(input.waMsgId)
    if (exists) {
      const result: PipelineResult = { reply: "", intent: "duplicate", blocked: true }
      trace.set("reason", "duplicate").finish(result); storeTrace(trace)
      return result
    }
  }

  // ── 4. Persist inbound message ──────────────────────────────────────
  trace.begin("persist_inbound")
  await MessageModel.append({
    conversationId: conv.id, role: "CUSTOMER", content: normalized, waMsgId: input.waMsgId,
  })

  // ── 5. Rate limit ───────────────────────────────────────────────────
  trace.begin("rate_limit")
  const rate = checkRateLimit(customer.id)
  if (!rate.allowed) {
    if (rate.notify) {
      await MessageModel.append({ conversationId: conv.id, role: "BOT", content: RATE_LIMIT_REPLY })
    }
    return blockReply(conv.id, RATE_LIMIT_REPLY, "rate_limited", trace)
  }

  // ── 6. PII scan on input ────────────────────────────────────────────
  trace.begin("pii_scan")
  const piiMatches = scanPii(normalized)
  if (piiMatches.length > 0) {
    const types = [...new Set(piiMatches.map((m) => m.type))]
    trace.set("pii_matched", types)
    await ActivityLogModel.log("pii_detected", `PII detected: ${types.join(", ")}`, conv.id, { piiTypes: types })
  }

  // ── 7. Firewall — 3-tier injection defense ──────────────────────────
  trace.begin("firewall_tier1")
  const scanResult = analyzeTurn(customer.phone, normalized)
  const verdict = classifyVerdict(scanResult.reasons)
  trace.set("verdict", verdict).set("reasons", scanResult.reasons)

  if (verdict === "BLOCK") {
    await ActivityLogModel.log("injection_blocked", `T1 blocked: ${scanResult.reasons.join(", ")}`, conv.id, {
      text: normalized, reasons: scanResult.reasons, tier: 1,
    })
    return blockReply(conv.id, INJECTION_REPLY, "injection", trace)
  }

  if (verdict === "UNCERTAIN") {
    trace.set("reason_triggered", scanResult.reasons).begin("firewall_tier2")
    const classifierResult = await classifyInput(normalized)
    trace.set("classifier_verdict", classifierResult.verdict)
      .set("classifier_reasons", classifierResult.reasons)
      .set("classifier_confidence", classifierResult.confidence)

    if (classifierResult.verdict === "INJECTION") {
      await ActivityLogModel.log("injection_blocked", `T2 blocked: ${classifierResult.reasons.join(", ")}`, conv.id, {
        text: normalized, reasons: classifierResult.reasons, tier: 2,
      })
      return blockReply(conv.id, INJECTION_REPLY, "injection", trace)
    }

    if (classifierResult.verdict === "SUSPICIOUS") {
      trace.begin("firewall_tier3")
      const history = await MessageModel.recentByConversation(conv.id, 6)
      const historyTexts = history.map((m) => `${m.role}: ${m.content}`)

      const judgeResult = await judgeInput(normalized, classifierResult.reasons, historyTexts)
      trace.set("judge_verdict", judgeResult.verdict).set("judge_reasons", judgeResult.reasons)

      if (judgeResult.verdict === "BLOCK") {
        await ActivityLogModel.log("injection_blocked", `T3 blocked: ${judgeResult.reasons.join(", ")}`, conv.id, {
          text: normalized, reasons: judgeResult.reasons, tier: 3,
        })
        return blockReply(conv.id, INJECTION_REPLY, "injection", trace)
      }

      logger.info("Judge passed suspicious message", { reasons: judgeResult.reasons })
    }
  }

  // ── 8. Budget check ─────────────────────────────────────────────────
  trace.begin("budget_check")
  if (await isBudgetExceeded()) {
    await ActivityLogModel.log("budget_exceeded", "Daily LLM budget exceeded", conv.id)
    return blockReply(conv.id, BUDGET_REPLY, "budget_exceeded", trace)
  }

  // ── 9. Load context ─────────────────────────────────────────────────
  trace.begin("load_context")
  const [store, products, aiConfig, paymentMethods] = await Promise.all([
    StoreModel.find(),
    ProductModel.listAvailable(),
    AiConfigModel.find(),
    StorePaymentMethodModel.listActive(),
  ])

  const isActive = aiConfig?.isActive ?? true
  if (!isActive) {
    return blockReply(conv.id, "Maaf, bot sedang tidak aktif. CS manusia akan segera membantu Anda.", "inactive", trace)
  }

  const storeInfo = {
    businessName: store?.businessName ?? env.ai.defaultModel,
    phone: store?.phone ?? "",
    address: store?.address ?? null,
    businessHours: store?.businessHours ?? null,
    paymentMethods: store?.paymentMethods ?? null,
    activePaymentMethods: paymentMethods.map((pm) => ({
      type: pm.type,
      label: pm.label,
      bankName: pm.bankName,
      accountNumber: pm.accountNumber,
      accountName: pm.accountName,
      providerName: pm.providerName,
      phoneNumber: pm.phoneNumber,
      qrImageUrl: pm.qrImageUrl,
      instructions: pm.instructions,
    })),
    shippingInfo: store?.shippingInfo ?? null,
    returnPolicy: store?.returnPolicy ?? null,
  }
  trace.set("store_name", storeInfo.businessName).set("product_count", products.length)

  const systemPrompt = buildSystemPrompt(storeInfo, products, aiConfig?.knowledgeBase ?? null, aiConfig?.systemPrompt || null)

  // ── 10. Build messages with history ─────────────────────────────────
  trace.begin("build_context")
  const recentMessages = await MessageModel.recentByConversation(conv.id, 20)
  const historyMessages: ChatMessage[] = recentMessages
    .filter((m) => m.role !== "CUSTOMER" || m.content !== normalized)
    .slice(-10)
    .map((m) => ({
      role: m.role === "CUSTOMER" ? "user" : "assistant",
      content: m.role === "CUSTOMER" ? wrapCustomerMessage(m.content) : m.content,
    }))

  trace.set("history_count", historyMessages.length)

  // ── 11. LLM call via circuit breaker ────────────────────────────────
  trace.begin("llm_call")
  const model = aiConfig?.model || env.ai.defaultModel
  const maxTokens = aiConfig?.maxTokens ?? env.ai.maxTokens

  const cbResult = await withCircuit(async () =>
    chat(systemPrompt, wrapCustomerMessage(normalized), {
      model, maxTokens,
      temperature: aiConfig ? Number(aiConfig.temperature) : env.ai.temperature,
      timeout: 30_000,
    }),
  )

  if (!cbResult.allowed) {
    const reply = FALLBACK_REPLY
    await ActivityLogModel.log("llm_failed", "LLM call failed (circuit breaker)", conv.id, {
      error: cbResult.error?.message,
    })
    trace.set("error", cbResult.error?.message)
    return blockReply(conv.id, reply, "error", trace)
  }

  const completion = cbResult.result!
  trace.set("llm_model", completion.model).set("llm_tokens", completion.usage)
  let raw = completion.content.trim()
  let llmOutput: LLMOutput

  // ── 12. Parse LLM output ────────────────────────────────────────────
  trace.begin("parse_output")
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
  trace.set("intent", llmOutput.intent)

  // ── 13. Execute intent action ───────────────────────────────────────
  trace.begin("handle_intent")
  const ctx = {
    customerId: customer.id,
    conversationId: conv.id,
    greetingMessage: aiConfig?.greetingMessage,
  }

  const { reply: actionReply, qrisImageUrl: actionQrisUrl } = await handleIntent(llmOutput, ctx)

  // ── 14. Sanitize + output scan (Layer 4) ────────────────────────────
  trace.begin("output_scan")
  let finalReply = sanitizeReply(actionReply)

  const outputResult = scanOutput(finalReply)
  trace.set("scan_result", outputResult.reason ?? "pass")
  if (outputResult.blocked) {
    finalReply = LEAK_FALLBACK
    await ActivityLogModel.log("output_blocked", `Output scan: ${outputResult.reason}`, conv.id, {
      reason: outputResult.reason, intent: llmOutput.intent,
    })
  }

  // ── 15. PII scan on output — redact if any leaked ───────────────────
  trace.begin("output_pii")
  const piiFound = !outputResult.blocked ? scanPii(finalReply) : []
  if (piiFound.length > 0) {
    trace.set("pii_redacted", piiFound.map((m) => m.type))
    await ActivityLogModel.log("pii_output", `PII in outbound reply: ${piiFound.map((m) => m.type).join(", ")}`, conv.id, {
      piiTypes: piiFound.map((m) => m.type), intent: llmOutput.intent,
    })
    for (const m of piiFound.sort((a, b) => b.start - a.start)) {
      finalReply = finalReply.slice(0, m.start) + `[${m.type.toUpperCase()}]` + finalReply.slice(m.end)
    }
  }

  // ── 16. Grounding check (for inquiry/order intents) ─────────────────
  trace.begin("grounding_check")
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
    trace.set("grounded", grounding.grounded).set("unsupported_claims", grounding.unsupportedClaims)

    if (!grounding.grounded) {
      await ActivityLogModel.log("grounding_failed", `Unsupported claims: ${grounding.unsupportedClaims.join(", ")}`, conv.id, {
        unsupportedClaims: grounding.unsupportedClaims, intent: llmOutput.intent,
      })
      finalReply = "Maaf, ada informasi yang kurang tepat dari jawaban saya sebelumnya. " +
        "Bisa dicek kembali ya, atau hubungi CS kami untuk info lebih lanjut."
    }
  }

  // ── 17. Record usage ────────────────────────────────────────────────
  trace.begin("record_usage")
  await recordLlmUsage(completion.usage)
  await ActivityLogModel.log("llm_call", `LLM call completed (${llmOutput.intent})`, conv.id, {
    intent: llmOutput.intent, model: completion.model, usage: completion.usage,
  })

  // ── 18. Persist outbound + touch ────────────────────────────────────
  await MessageModel.append({ conversationId: conv.id, role: "BOT", content: finalReply })
  await ConversationModel.touch(conv.id)

  const result: PipelineResult = { reply: finalReply, intent: llmOutput.intent, blocked: false, qrisImageUrl: actionQrisUrl }
  trace.set("reply_length", finalReply.length).finish(result)
  storeTrace(trace)
  return result
}
