import { CustomerModel } from "@/src/models/customer"
import { ConversationModel } from "@/src/models/conversation"
import type { PipelineStep } from "../types"

/**
 * Step 2 — Upsert customer by phone and find/create active conversation.
 */
export const ensureCustomerStep: PipelineStep = {
  name: "ensure_customer",
  async run(ctx) {
    const customer = await CustomerModel.upsertByPhone(ctx.input.phone, ctx.input.name)
    const conv = await ConversationModel.findOrCreateActive(customer.id)

    ctx.customerId = customer.id
    ctx.customerPhone = customer.phone
    ctx.conversationId = conv.id

    ctx.trace
      .set("customer_id", customer.id)
      .set("conversation_id", conv.id)

    return { kind: "continue" }
  },
}
