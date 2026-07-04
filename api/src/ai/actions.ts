import type { LLMOutput, ActionCtx, ActionResult } from "@/src/types/ai"
import { ProductModel } from "@/src/models/catalog"
import { OrderModel } from "@/src/models/order"
import { CustomerModel } from "@/src/models/customer"
import { ConversationModel } from "@/src/models/conversation"
import { ActivityLogModel } from "@/src/models/activity-log"
import { StorePaymentMethodModel } from "@/src/models/store-payment"

export async function handleIntent(output: LLMOutput, ctx: ActionCtx): Promise<ActionResult> {
  switch (output.intent) {
    case "order":
      return handleOrder(output, ctx)
    case "inquiry":
      return handleInquiry(output)
    case "greeting":
      return handleGreeting(output, ctx)
    case "complaint":
      return handleComplaint(output, ctx)
    case "escalate":
      return handleEscalate(output, ctx)
    case "unknown":
      return { reply: output.reply }
  }
}

async function handleOrder(
  output: Extract<LLMOutput, { intent: "order" }>,
  ctx: ActionCtx,
): Promise<ActionResult> {
  const names = output.items.map((i) => i.name)
  const productMap = await ProductModel.findByNames(ctx.ownerId, names)
  const resolved: Array<{ productId: string; productName: string; unitPrice: number; qty: number }> = []
  const unmatched: string[] = []

  for (const item of output.items) {
    const product = productMap.get(item.name.toLowerCase())
    if (product) {
      resolved.push({
        productId: product.id,
        productName: product.name,
        unitPrice: Number(product.price),
        qty: item.qty,
      })
    } else {
      unmatched.push(item.name)
    }
  }

  if (unmatched.length > 0) {
    const list = unmatched.map((n) => `"${n}"`).join(", ")
    return { reply: `Maaf, produk ${list} tidak ditemukan di katalog kami. Bisa cek nama produknya kembali?` }
  }

  const { order } = await OrderModel.createFromItems(ctx.ownerId, ctx.customerId, resolved, output.notes)
  await CustomerModel.incrementOrders(ctx.customerId)
  await ActivityLogModel.log(ctx.ownerId, "order_created", `Order ${order.id} created from WA chat`, order.id, {
    items: resolved,
    notes: output.notes,
  })

  const lines = resolved.map(
    (r) => `• ${r.productName} × ${r.qty} = Rp${(r.unitPrice * r.qty).toLocaleString("id-ID")}`,
  )
  const total = Number(order.totalAmount).toLocaleString("id-ID")

  const paymentMethods = await StorePaymentMethodModel.listActive(ctx.ownerId)
  const qrisMethod = paymentMethods.find((pm) => pm.type === "QRIS" && pm.qrImageUrl)
  const paymentLines = paymentMethods.map((pm) => {
    switch (pm.type) {
      case "QRIS":
        return pm.qrImageUrl
          ? `📱 QRIS: Silakan scan QR code yang dikirim bersama pesan ini`
          : `📱 QRIS: Tersedia`
      case "BANK_TRANSFER":
        return `🏦 Transfer ${pm.bankName ?? "Bank"}: ${pm.accountNumber ?? ""} a/n ${pm.accountName ?? "-"}`
      case "E_WALLET":
        return `📱 ${pm.providerName ?? "E-Wallet"}: ${pm.phoneNumber ?? ""}`
      case "COD":
        return `💵 Bayar di Tempat: ${pm.instructions ?? "Bayar tunai saat barang diterima"}`
      default:
        return ""
    }
  }).filter(Boolean)

  const reply: string[] = [
    "Pesanan diterima! 🎉",
    ...lines,
    `Total: Rp${total}`,
  ]

  if (paymentLines.length > 0) {
    reply.push("", "💳 Pembayaran:")
    reply.push(...paymentLines.map((l) => `  ${l}`))
    reply.push("", "Setelah bayar, konfirmasikan ke kami ya 😊")
  }

  reply.push("", "Terima kasih, pesanan akan segera diproses.")

  return { reply: reply.join("\n"), qrisImageUrl: qrisMethod?.qrImageUrl ?? null }
}

async function handleInquiry(output: Extract<LLMOutput, { intent: "inquiry" }>): Promise<ActionResult> {
  if (output.reply) {
    return { reply: output.reply }
  }
  return { reply: "Maaf, bisa dijelaskan lebih detail pertanyaannya?" }
}

async function handleGreeting(
  _output: Extract<LLMOutput, { intent: "greeting" }>,
  ctx: ActionCtx,
): Promise<ActionResult> {
  if (ctx.greetingMessage) {
    return { reply: ctx.greetingMessage }
  }
  return { reply: "Halo! Ada yang bisa kami bantu?" }
}

async function handleComplaint(
  output: Extract<LLMOutput, { intent: "complaint" }>,
  ctx: ActionCtx,
): Promise<ActionResult> {
  if (output.escalate) {
    await ConversationModel.setStatus(ctx.conversationId, "ESCALATED")
    await ActivityLogModel.log(ctx.ownerId, "complaint_escalated", "Complaint escalated to human", ctx.conversationId, {
      reply: output.reply,
    })
  }
  return { reply: output.reply }
}

async function handleEscalate(
  output: Extract<LLMOutput, { intent: "escalate" }>,
  ctx: ActionCtx,
): Promise<ActionResult> {
  await ConversationModel.setStatus(ctx.conversationId, "ESCALATED")
  await ActivityLogModel.log(ctx.ownerId, "escalated", `Escalated: ${output.reason}`, ctx.conversationId, {
    reason: output.reason,
  })
  return { reply: "Baik, akan kami hubungkan dengan CS manusia. Mohon tunggu sebentar ya." }
}
