import { StoreModel } from "@/src/models/store"
import { ProductModel } from "@/src/models/catalog"
import { AiConfigModel } from "@/src/models/ai-config"
import { StorePaymentMethodModel } from "@/src/models/store-payment"
import { env } from "@/src/config/env"
import type { PipelineStep } from "../types"

/**
 * Step 9 — Load context: store info, products, AI config, payment methods.
 * Returns a break result if the bot is inactive.
 */
export const contextLoaderStep: PipelineStep = {
  name: "load_context",
  async run(ctx) {
    const [store, products, aiConfig, paymentMethods] = await Promise.all([
      StoreModel.find(),
      ProductModel.listAvailable(),
      AiConfigModel.find(),
      StorePaymentMethodModel.listActive(),
    ])

    const isActive = aiConfig?.isActive ?? true
    if (!isActive) {
      return {
        kind: "break",
        result: {
          reply: "Maaf, bot sedang tidak aktif. CS manusia akan segera membantu Anda.",
          intent: "inactive",
          blocked: true,
          qrisImageUrl: null,
        },
      }
    }

    ctx.aiConfig = aiConfig
    ctx.products = products

    // --- build store info ---
    ctx.storeInfo = {
      businessName: store?.businessName ?? env.ai.defaultModel,
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

    ctx.trace
      .set("store_name", ctx.storeInfo.businessName)
      .set("product_count", products.length)

    return { kind: "continue" }
  },
}
