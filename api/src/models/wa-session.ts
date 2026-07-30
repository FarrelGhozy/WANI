import { BaseModel } from "@/models/base";
import type { WaSession } from "@/types/wa-session";

export class WaSessionModel extends BaseModel {
  protected static override get delegate() {
    return this.db.waSession;
  }

  static async findByOwner(ownerId: string): Promise<WaSession | null> {
    return this.delegate.findUnique({ where: { ownerId } }) as Promise<WaSession | null>;
  }

  static async upsertByOwner(
    ownerId: string,
    data: Partial<WaSession>
  ): Promise<WaSession> {
    const {
      ownerId: _,
      id,
      createdAt,
      updatedAt,
      ...rest
    } = data as Record<string, unknown>;
    return this.db.waSession.upsert({
      where: { ownerId },
      create: { ownerId, waSessionName: `store-${ownerId}`, ...rest } as any,
      update: rest as any,
    });
  }

  static async clearQr(ownerId: string): Promise<WaSession> {
    return this.db.waSession.update({
      where: { ownerId },
      data: { qr: null },
    }) as Promise<WaSession>;
  }
}
