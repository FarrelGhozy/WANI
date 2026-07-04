import { analyzeTurn, classifyVerdict } from "@/src/guardrails/firewall"
import { classifyInput, judgeInput } from "@/src/guardrails/classifier"
import { MessageModel } from "@/src/models/message"
import { ActivityLogModel } from "@/src/models/activity-log"
import { logger } from "@/src/config/logger"
import { STEP_REPLIES, type PipelineStep } from "../types"

/**
 * Step 7 — 3-tier injection defence (T1 regex → T2 classifier → T3 LLM judge).
 */
export const firewallStep: PipelineStep = {
  name: "firewall",
  async run(ctx) {
    const blocked = await runInputFirewall({
      ownerId: ctx.ownerId,
      normalized: ctx.normalized!,
      customerPhone: ctx.customerPhone,
      conversationId: ctx.conversationId!,
      trace: ctx.trace,
    })
    if (blocked) {
      await MessageModel.append({
        ownerId: ctx.ownerId,
        conversationId: ctx.conversationId!,
        role: "BOT",
        content: STEP_REPLIES.INJECTION,
      })
      return {
        kind: "break",
        result: {
          reply: STEP_REPLIES.INJECTION,
          intent: "injection",
          blocked: true,
          qrisImageUrl: null,
        },
      }
    }
    return { kind: "continue" }
  },
}

async function runInputFirewall(ctx: {
  ownerId: string
  normalized: string
  customerPhone?: string
  conversationId?: string
  trace: any
}): Promise<boolean> {
  ctx.trace.begin("firewall_tier1")
  const scanResult = analyzeTurn(ctx.customerPhone ?? "", ctx.normalized)
  const verdict = classifyVerdict(scanResult.reasons)
  ctx.trace.set("verdict", verdict).set("reasons", scanResult.reasons)

  if (verdict === "BLOCK") {
    await ActivityLogModel.log(ctx.ownerId, "injection_blocked", `T1 blocked: ${scanResult.reasons.join(", ")}`, ctx.conversationId!, {
      text: ctx.normalized, reasons: scanResult.reasons, tier: 1,
    })
    return true
  }

  if (verdict === "UNCERTAIN") {
    ctx.trace.set("reason_triggered", scanResult.reasons).begin("firewall_tier2")
    const classifierResult = await classifyInput(ctx.normalized)
    ctx.trace
      .set("classifier_verdict", classifierResult.verdict)
      .set("classifier_reasons", classifierResult.reasons)
      .set("classifier_confidence", classifierResult.confidence)

    if (classifierResult.verdict === "INJECTION") {
      await ActivityLogModel.log(ctx.ownerId, "injection_blocked", `T2 blocked: ${classifierResult.reasons.join(", ")}`, ctx.conversationId!, {
        text: ctx.normalized, reasons: classifierResult.reasons, tier: 2,
      })
      return true
    }

    if (classifierResult.verdict === "SUSPICIOUS") {
      ctx.trace.begin("firewall_tier3")
      const history = await MessageModel.recentByConversation(ctx.conversationId!, 6)
      const historyTexts = history.map((m) => `${m.role}: ${m.content}`)

      const judgeResult = await judgeInput(ctx.normalized, classifierResult.reasons, historyTexts)
      ctx.trace.set("judge_verdict", judgeResult.verdict).set("judge_reasons", judgeResult.reasons)

      if (judgeResult.verdict === "BLOCK") {
        await ActivityLogModel.log(ctx.ownerId, "injection_blocked", `T3 blocked: ${judgeResult.reasons.join(", ")}`, ctx.conversationId!, {
          text: ctx.normalized, reasons: judgeResult.reasons, tier: 3,
        })
        return true
      }

      logger.info("Judge passed suspicious message", { reasons: judgeResult.reasons })
    }
  }

  return false
}
