import { MessageModel } from "@/src/models/message"
import type { PipelineStep } from "../types"

/**
 * Step 3 — Deduplicate by waMsgId (WhatsApp message ID).
 * Skips processing if this message was already received.
 */
export const dedupStep: PipelineStep = {
  name: "dedup",
  async run(ctx) {
    if (!ctx.input.waMsgId) return { kind: "continue" }

    const exists = await MessageModel.existsByWaMsgId(ctx.input.waMsgId)
    if (exists) {
      return {
        kind: "break",
        result: {
          reply: "",
          intent: "duplicate",
          blocked: true,
          qrisImageUrl: null,
        },
      }
    }

    return { kind: "continue" }
  },
}
