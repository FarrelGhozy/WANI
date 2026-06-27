import { sanitizeReply } from "@/src/guardrails/output"
import { scanOutput } from "@/src/guardrails/firewall"
import { scanPii } from "@/src/guardrails/pii"
import { checkGrounding } from "@/src/guardrails/classifier"
import { ActivityLogModel } from "@/src/models/activity-log"
import { STEP_REPLIES, type PipelineStep } from "../types"

/**
 * Step 14 — Output guardrails: sanitize → leak scan → PII redact → grounding.
 * Mutates `ctx.finalReply` through each sub-layer.
 */
export const outputGuardrailsStep: PipelineStep = {
  name: "output_guardrails",
  async run(ctx) {
    const params = {
      reply: ctx.actionReply!,
      intent: ctx.llmIntent!,
      normalized: ctx.normalized!,
      convId: ctx.conversationId!,
      storeInfo: ctx.storeInfo!,
      products: ctx.products!,
      trace: ctx.trace,
    }
    ctx.finalReply = await runOutputGuardrails(params)
    return { kind: "continue" }
  },
}

interface OutputGuardrailParams {
  reply: string
  intent: string
  normalized: string
  convId: string
  storeInfo: any
  products: any[]
  trace: any
}

async function runOutputGuardrails(params: OutputGuardrailParams): Promise<string> {
  const { reply, intent, normalized, convId, storeInfo, products, trace } = params

  // Layer 1 — sanitize
  trace.begin("output_scan")
  let finalReply = sanitizeReply(reply)

  // Layer 2 — output scan (canary / leak detection)
  const outputResult = scanOutput(finalReply)
  trace.set("scan_result", outputResult.reason ?? "pass")
  if (outputResult.blocked) {
    await ActivityLogModel.log("output_blocked", `Output scan: ${outputResult.reason}`, convId, {
      reason: outputResult.reason, intent,
    })
    return STEP_REPLIES.LEAK
  }

  // Layer 3 — PII redaction on outbound
  trace.begin("output_pii")
  const piiFound = scanPii(finalReply)
  if (piiFound.length > 0) {
    trace.set("pii_redacted", piiFound.map((m: any) => m.type))
    await ActivityLogModel.log("pii_output", `PII in outbound reply: ${piiFound.map((m: any) => m.type).join(", ")}`, convId, {
      piiTypes: piiFound.map((m: any) => m.type), intent,
    })
    for (const m of piiFound.sort((a: any, b: any) => b.start - a.start)) {
      finalReply = finalReply.slice(0, m.start) + `[${m.type.toUpperCase()}]` + finalReply.slice(m.end)
    }
  }

  // Layer 4 — grounding check (only for inquiry / order)
  trace.begin("grounding_check")
  if (intent === "inquiry" || intent === "order") {
    const storeStr = [
      `Nama: ${storeInfo.businessName}`,
      `Alamat: ${storeInfo.address ?? "-"}`,
      `Jam: ${storeInfo.businessHours ?? "-"}`,
      `Pembayaran: ${storeInfo.paymentMethods ?? "-"}`,
      `Pengiriman: ${storeInfo.shippingInfo ?? "-"}`,
      `Retur: ${storeInfo.returnPolicy ?? "-"}`,
    ].join("\n")

    const productsStr = products
      .filter((p: any) => p.isAvailable)
      .map((p: any) => `- ${p.name}: Rp${p.price.toLocaleString("id-ID")} (stok: ${p.stock})`)
      .join("\n")

    const grounding = await checkGrounding(finalReply, normalized, storeStr, productsStr)
    trace.set("grounded", grounding.grounded).set("unsupported_claims", grounding.unsupportedClaims)

    if (!grounding.grounded) {
      await ActivityLogModel.log("grounding_failed", `Unsupported claims: ${grounding.unsupportedClaims.join(", ")}`, convId, {
        unsupportedClaims: grounding.unsupportedClaims, intent,
      })
      return "Maaf, ada informasi yang kurang tepat dari jawaban saya sebelumnya. " +
        "Bisa dicek kembali ya, atau hubungi CS kami untuk info lebih lanjut."
    }
  }

  return finalReply
}
