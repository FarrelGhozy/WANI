import { MessageModel } from "@/src/models/message"
import type { ClearedInput, Step } from "../types"
import { ok, fail } from "../either"

export const dedupStep: Step<ClearedInput, ClearedInput> = {
  name: "dedup",
  async run(input, _ctx) {
    if (!input.waMsgId) return ok(input)

    const exists = await MessageModel.existsByWaMsgId(input.waMsgId)
    if (exists) {
      return fail({ type: "short_circuit", reply: "", intent: "duplicate" })
    }

    return ok(input)
  },
}
