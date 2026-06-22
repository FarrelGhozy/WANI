import { BaseModel } from "@/src/models/base"
import type { Message } from "@db/client"

export interface AppendData {
  conversationId: string
  role: "CUSTOMER" | "BOT" | "HUMAN"
  content: string
  waMsgId?: string | null
  msgType?: string
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
}
