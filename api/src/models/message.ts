import { BaseModel } from "@/src/models/base"
import type { Message, $Enums } from "@db/client"

export interface AppendData {
  conversationId: string
  role: $Enums.MessageRole
  content: string
  waMsgId?: string | null
  msgType?: string
}

export interface OutgoingItem {
  id: string
  jid: string
  text: string
}

export class MessageModel extends BaseModel {
  protected static override get delegate() {
    return this.db.message
  }

  static async recentByConversation(convId: string, limit = 20): Promise<Message[]> {
    return this.delegate.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: limit,
    })
  }

  static async existsByWaMsgId(waMsgId: string): Promise<boolean> {
    const msg = await this.delegate.findUnique({ where: { waMsgId } })
    return msg !== null
  }

  static async append(data: AppendData): Promise<Message> {
    return this.delegate.create({
      data: {
        id: crypto.randomUUID(),
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        msgType: data.msgType ?? "text",
        waMsgId: data.waMsgId ?? undefined,
      },
    })
  }

  static async listOutgoing(): Promise<OutgoingItem[]> {
    const messages = await this.delegate.findMany({
      where: { role: { in: ["HUMAN", "BOT"] }, waMsgId: null },
      include: {
        conversation: {
          select: {
            customer: { select: { phone: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    })

    return messages.map((m) => ({
      id: m.id,
      jid: `${m.conversation.customer.phone}@s.whatsapp.net`,
      text: m.content,
    }))
  }

  static async markDelivered(id: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { waMsgId: `sent-${id}` },
    })
  }
}
