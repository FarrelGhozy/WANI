import { BaseModel } from "@/models/base";
import type { Conversation, $Enums } from "@db/client";
import { NotFoundError } from "@/utils/errors";

export class ConversationModel extends BaseModel {
  protected static override get delegate() {
    return this.db.conversation;
  }

  static async findOrCreateActive(
    ownerId: string,
    customerId: string
  ): Promise<Conversation> {
    const existing = await this.delegate.findFirst({
      where: { ownerId, customerId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;
    return this.delegate.create({
      data: { ownerId, customerId },
    });
  }

  static async getOwnedOrThrow(
    ownerId: string,
    id: string
  ): Promise<Conversation> {
    const conversation = await this.delegate.findFirst({
      where: { id, ownerId },
    });
    if (!conversation) throw new NotFoundError("conversation not found");
    return conversation as Conversation;
  }

  static async touchOwned(ownerId: string, id: string): Promise<void> {
    await this.getOwnedOrThrow(ownerId, id);
    await this.delegate.update({
      where: { id, ownerId },
      data: { lastMessageAt: new Date() },
    });
  }

  static async setStatusOwned(
    ownerId: string,
    id: string,
    status: string
  ): Promise<void> {
    await this.getOwnedOrThrow(ownerId, id);
    await this.delegate.update({
      where: { id, ownerId },
      data: { status: status as $Enums.ConversationStatus },
    });
  }

  static async touch(id: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });
  }

  static async setStatus(id: string, status: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { status: status as $Enums.ConversationStatus },
    });
  }
}
