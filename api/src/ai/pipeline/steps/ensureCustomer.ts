import { CustomerModel } from "@/models/customer"
import { ConversationModel } from "@/models/conversation"
import type { NormalizedInput, ClearedInput, Step } from "../types"
import { ok } from "../either"

export const ensureCustomerStep: Step<NormalizedInput, ClearedInput> = {
  name: "ensure_customer",
  async run(input, { trace }) {
    const customer = await CustomerModel.upsertByOwnerPhone(input.ownerId, input.phone, input.name)
    const conv = await ConversationModel.findOrCreateActive(input.ownerId, customer.id)

    trace.set("customer_id", customer.id).set("conversation_id", conv.id)

    return ok({
      ownerId: input.ownerId,
      phone: input.phone,
      name: input.name,
      waMsgId: input.waMsgId,
      text: input.text,
      normalized: input.normalized,
      customerId: customer.id,
      customerPhone: customer.phone,
      conversationId: conv.id,
    })
  },
}
