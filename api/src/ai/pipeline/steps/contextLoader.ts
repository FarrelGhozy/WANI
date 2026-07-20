import { StoreModel } from "@/src/models/store"
import { ProductModel } from "@/src/models/catalog"
import { AiConfigModel } from "@/src/models/ai-config"
import { StorePaymentMethodModel } from "@/src/models/store-payment"
import type { ClearedInput, EnrichedInput, Step } from "../types"
import { ok, fail } from "../either"

export const contextLoaderStep: Step<ClearedInput, EnrichedInput> = {
  name: "load_context",
  async run(input, { trace }) {
    const [store, products, aiConfig, paymentMethods] = await Promise.all([
      StoreModel.findByOwner(input.ownerId),
      ProductModel.listAvailable(input.ownerId),
      AiConfigModel.findByOwner(input.ownerId),
      StorePaymentMethodModel.listActive(input.ownerId),
    ])

    if (aiConfig && !aiConfig.isActive) {
      return fail({ type: "short_circuit", reply: "Maaf, bot sedang tidak aktif. CS manusia akan segera membantu Anda.", intent: "inactive" })
    }

    const storeInfo = {
      businessName: store?.businessName ?? "",
      phone: store?.phone ?? "",
      address: store?.address ?? null,
      businessHours: store?.businessHours ?? null,
      paymentMethods: store?.paymentMethods ?? null,
      activePaymentMethods: paymentMethods.map((pm) => ({
        type: pm.type,
        label: pm.label,
        bankName: pm.bankName,
        accountNumber: pm.accountNumber,
        accountName: pm.accountName,
        providerName: pm.providerName,
        phoneNumber: pm.phoneNumber,
        qrImageUrl: pm.qrImageUrl,
        instructions: pm.instructions,
      })),
      shippingInfo: store?.shippingInfo ?? null,
      returnPolicy: store?.returnPolicy ?? null,
    }

    trace.set("store_name", storeInfo.businessName).set("product_count", products.length)

    return ok({
      ownerId: input.ownerId,
      phone: input.phone,
      name: input.name,
      waMsgId: input.waMsgId,
      text: input.text,
      normalized: input.normalized,
      customerId: input.customerId,
      customerPhone: input.customerPhone,
      conversationId: input.conversationId,
      storeInfo,
      products,
      aiConfig: (aiConfig ?? {}) as Record<string, unknown>,
    })
  },
}
