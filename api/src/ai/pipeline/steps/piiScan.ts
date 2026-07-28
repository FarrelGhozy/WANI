import { scanPii } from "@/guardrails/pii"
import { ActivityLogModel } from "@/models/activity-log"
import type { ClearedInput, Step } from "../types"
import { ok } from "../either"

export const piiScanStep: Step<ClearedInput, ClearedInput> = {
  name: "pii_scan",
  async run(input, { trace }) {
    const matches = scanPii(input.normalized)
    if (matches.length > 0) {
      const types = [...new Set(matches.map((m) => m.type))]
      trace.set("pii_matched", types)
      await ActivityLogModel.log(input.ownerId, "pii_detected", `PII detected: ${types.join(", ")}`, input.conversationId, {
        piiTypes: types,
      })
    }
    return ok(input)
  },
}
