import { normalizeInput } from "@/src/guardrails/input"
import type { PipelineStep } from "../types"

/**
 * Step 1 — Normalize the raw input text.
 * Returns a break result on empty input.
 */
export const normalizeStep: PipelineStep = {
  name: "normalize",
  async run(ctx) {
    const normalized = normalizeInput(ctx.input.text)
    if (!normalized) {
      return {
        kind: "break",
        result: {
          reply: "Maaf, pesan kosong. Silakan ketik pesan Anda.",
          intent: "unknown",
          blocked: true,
          qrisImageUrl: null,
        },
      }
    }
    ctx.normalized = normalized
    ctx.trace.set("input_length", normalized.length)
    return { kind: "continue" }
  },
}
