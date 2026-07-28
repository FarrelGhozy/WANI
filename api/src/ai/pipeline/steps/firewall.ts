import { analyzeTurn, classifyVerdict } from "@/guardrails/firewall"
import { classifyInput, judgeInput } from "@/guardrails/classifier"
import { MessageModel } from "@/models/message"
import { ActivityLogModel } from "@/models/activity-log"
import { logger } from "@/config/logger"
import { STEP_REPLIES, type ClearedInput, type Step } from "../types"
import { ok, fail } from "../either"

export const firewallStep: Step<ClearedInput, ClearedInput> = {
  name: "firewall",
  async run(input, { trace }) {
    const blocked = await runInputFirewall(input, trace)
    if (blocked) {
      await MessageModel.append({
        ownerId: input.ownerId,
        conversationId: input.conversationId,
        role: "BOT",
        content: STEP_REPLIES.INJECTION,
      })
      return fail({ type: "short_circuit", reply: STEP_REPLIES.INJECTION, intent: "injection" })
    }
    return ok(input)
  },
}

async function runInputFirewall(
  input: ClearedInput,
  trace: any,
): Promise<boolean> {
  trace.begin("firewall_tier1")
  const scanResult = analyzeTurn(input.customerPhone, input.normalized)
  const verdict = classifyVerdict(scanResult.reasons)
  trace.set("verdict", verdict).set("reasons", scanResult.reasons)

  if (verdict === "BLOCK") {
    await ActivityLogModel.log(input.ownerId, "injection_blocked", `T1 blocked: ${scanResult.reasons.join(", ")}`, input.conversationId, {
      text: input.normalized, reasons: scanResult.reasons, tier: 1,
    })
    return true
  }

  if (verdict === "UNCERTAIN") {
    trace.set("reason_triggered", scanResult.reasons).begin("firewall_tier2")
    const classifierResult = await classifyInput(input.normalized)
    trace
      .set("classifier_verdict", classifierResult.verdict)
      .set("classifier_reasons", classifierResult.reasons)
      .set("classifier_confidence", classifierResult.confidence)

    if (classifierResult.verdict === "INJECTION") {
      await ActivityLogModel.log(input.ownerId, "injection_blocked", `T2 blocked: ${classifierResult.reasons.join(", ")}`, input.conversationId, {
        text: input.normalized, reasons: classifierResult.reasons, tier: 2,
      })
      return true
    }

    if (classifierResult.verdict === "SUSPICIOUS") {
      trace.begin("firewall_tier3")
      const history = await MessageModel.recentByConversation(input.conversationId, 6)
      const historyTexts = history.map((m) => `${m.role}: ${m.content}`)

      const judgeResult = await judgeInput(input.normalized, classifierResult.reasons, historyTexts)
      trace.set("judge_verdict", judgeResult.verdict).set("judge_reasons", judgeResult.reasons)

      if (judgeResult.verdict === "BLOCK") {
        await ActivityLogModel.log(input.ownerId, "injection_blocked", `T3 blocked: ${judgeResult.reasons.join(", ")}`, input.conversationId, {
          text: input.normalized, reasons: judgeResult.reasons, tier: 3,
        })
        return true
      }

      logger.info("Judge passed suspicious message", { reasons: judgeResult.reasons })
    }
  }

  return false
}
