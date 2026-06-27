import { scanPii } from "@/src/guardrails/pii"
import { ActivityLogModel } from "@/src/models/activity-log"
import type { PipelineStep } from "../types"

/**
 * Step 6 — Passive PII scan on inbound message (log only, no blocking).
 */
export const piiScanStep: PipelineStep = {
  name: "pii_scan",
  async run(ctx) {
    const matches = scanPii(ctx.normalized!)
    if (matches.length > 0) {
      const types = [...new Set(matches.map((m) => m.type))]
      ctx.piiTypes = types
      ctx.trace.set("pii_matched", types)
      await ActivityLogModel.log("pii_detected", `PII detected: ${types.join(", ")}`, ctx.conversationId!, {
        piiTypes: types,
      })
    }
    return { kind: "continue" }
  },
}
