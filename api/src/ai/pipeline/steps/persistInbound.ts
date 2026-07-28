import { MessageModel } from "@/src/models/message"
import type { ClearedInput, Step } from "../types"
import { ok, fail } from "../either"

export const persistInboundStep: Step<ClearedInput, ClearedInput> = {
  name: "persist_inbound",
  async run(input, _ctx) {
    try {
      await MessageModel.append({
        ownerId: input.ownerId,
        conversationId: input.conversationId,
        role: "CUSTOMER",
        content: input.normalized,
        waMsgId: input.waMsgId,
      })
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
        return fail({ type: "short_circuit", reply: "", intent: "duplicate" })
      }
      throw err
    }
    return ok(input)
  },
}
