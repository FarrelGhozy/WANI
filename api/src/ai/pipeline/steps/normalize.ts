import { normalizeInput } from "@/guardrails/input"
import type { PipelineInput } from "@/types/ai"
import type { Step, NormalizedInput } from "../types"
import { ok, fail } from "../either"

export const normalizeStep: Step<PipelineInput, NormalizedInput> = {
  name: "normalize",
  async run(input, { trace }) {
    const normalized = normalizeInput(input.text)
    if (!normalized) {
      return fail({ type: "short_circuit", reply: "Maaf, pesan kosong. Silakan ketik pesan Anda.", intent: "empty" })
    }
    trace.set("input_length", normalized.length)
    return ok({
      ownerId: input.ownerId,
      phone: input.phone,
      name: input.name,
      waMsgId: input.waMsgId,
      text: input.text,
      normalized,
    })
  },
}
