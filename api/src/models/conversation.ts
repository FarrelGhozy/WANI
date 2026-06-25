import { BaseModel } from "@/src/models/base"
import type { Conversation, $Enums } from "@db/client"

export class ConversationModel extends BaseModel {
  protected static override get delegate() {
    return this.db.conversation
  }

  static async findOrCreateActive(customerId: string): Promise<Conversation> {
    const existing = await this.delegate.findFirst({
      where: { customerId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    })
    if (existing) return existing
    return this.delegate.create({
      data: { customerId },
    })
  }

  static async touch(id: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    })
  }

  static async setStatus(id: string, status: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { status: status as $Enums.ConversationStatus },
    })
  }
}
