import { sanitizeReply } from "@/src/guardrails/output"
import { scanOutput } from "@/src/guardrails/firewall"
import { scanPii } from "@/src/guardrails/pii"
import { checkGrounding } from "@/src/guardrails/classifier"
import { ActivityLogModel } from "@/src/models/activity-log"
import { STEP_REPLIES, type ActionInput, type GuardedInput, type Step } from "../types"
import { ok, fail } from "../either"

export const outputGuardrailsStep: Step<ActionInput, GuardedInput> = {
  name: "output_guardrails",
  async run(input, { trace }) {
    const finalReply = await runOutputGuardrails(input, trace)
    if (finalReply === STEP_REPLIES.LEAK) {
      return fail({ type: "short_circuit", reply: STEP_REPLIES.LEAK, intent: "leak" })
    }

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
      actionReply: input.actionReply,
      qrisImageUrl: input.qrisImageUrl,
      finalReply,
    })
  },
}

async function runOutputGuardrails(
  input: ActionInput,
  trace: any,
): Promise<string> {
  const { ownerId, actionReply, llmIntent, normalized, conversationId, storeInfo, products } = input

  trace.begin("output_scan")
  let finalReply = sanitizeReply(actionReply)

  const outputResult = scanOutput(finalReply)
  trace.set("scan_result", outputResult.reason ?? "pass")
  if (outputResult.blocked) {
    await ActivityLogModel.log(ownerId, "output_blocked", `Output scan: ${outputResult.reason}`, conversationId, {
      reason: outputResult.reason, intent: llmIntent,
    })
    return STEP_REPLIES.LEAK
  }

  trace.begin("output_pii")
  const piiFound = scanPii(finalReply)
  if (piiFound.length > 0) {
    trace.set("pii_redacted", piiFound.map((m) => m.type))
    await ActivityLogModel.log(ownerId, "pii_output", `PII in outbound reply: ${piiFound.map((m) => m.type).join(", ")}`, conversationId, {
      piiTypes: piiFound.map((m) => m.type), intent: llmIntent,
    })
    for (const m of piiFound.sort((a, b) => b.start - a.start)) {
      finalReply = finalReply.slice(0, m.start) + `[${m.type.toUpperCase()}]` + finalReply.slice(m.end)
    }
  }

  trace.begin("grounding_check")
  if (llmIntent === "inquiry" || llmIntent === "order") {
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
      await ActivityLogModel.log(ownerId, "grounding_failed", `Unsupported claims: ${grounding.unsupportedClaims.join(", ")}`, conversationId, {
        unsupportedClaims: grounding.unsupportedClaims, intent: llmIntent,
      })
      return "Maaf, ada informasi yang kurang tepat dari jawaban saya sebelumnya. " +
        "Bisa dicek kembali ya, atau hubungi CS kami untuk info lebih lanjut."
    }
  }

  return finalReply
}
