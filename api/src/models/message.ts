import { BaseModel } from "@/models/base";
import type { Message, $Enums } from "@db/client";

export interface AppendData {
  ownerId: string;
  conversationId: string;
  role: $Enums.MessageRole;
  content: string;
  waMsgId?: string | null;
  msgType?: string;
}

export class MessageModel extends BaseModel {
  protected static override get delegate() {
    return this.db.message;
  }

  static async recentByConversation(
    convId: string,
    limit = 20
  ): Promise<Message[]> {
    return this.delegate.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  static async recentByOwnerConversation(
    ownerId: string,
    convId: string,
    limit = 20
  ): Promise<Message[]> {
    return this.delegate.findMany({
      where: { ownerId, conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  static async existsByWaMsgId(waMsgId: string): Promise<boolean> {
    const msg = await this.delegate.findUnique({ where: { waMsgId } });
    return msg !== null;
  }

  static async append(data: AppendData): Promise<Message> {
    return this.delegate.create({
      data: {
        id: crypto.randomUUID(),
        ownerId: data.ownerId,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        msgType: data.msgType ?? "text",
        waMsgId: data.waMsgId ?? undefined,
      },
    });
  }


  /** Stamp the real WAHA message id once the reply is pushed successfully. */
  static async markSent(id: string, waMsgId: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { waMsgId },
    });
  }
}
