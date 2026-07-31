import { BaseModel } from "@/models/base"
import type { Conversation, $Enums } from "@db/client"

export class ConversationModel extends BaseModel {
  protected static override get delegate() {
    return this.db.conversation
  }

  static async findOrCreateActive(ownerId: string, customerId: string): Promise<Conversation> {
    const existing = await this.delegate.findFirst({
      where: { ownerId, customerId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    })
    if (existing) return existing

    try {
      return await this.delegate.create({
        data: { ownerId, customerId },
      })
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
        return this.delegate.findFirstOrThrow({
          where: { ownerId, customerId, status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
        })
      }
      throw err
    }
  }

  static async findByIdOwner(ownerId: string, id: string): Promise<Conversation | null> {
    return this.delegate.findFirst({ where: { id, ownerId } })
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
