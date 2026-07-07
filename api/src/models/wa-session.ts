import { BaseModel } from "@/src/models/base"
import type { WaSession, WaSessionData } from "@/src/types/wa-session"

export class WaSessionModel extends BaseModel {
  protected static override get delegate() {
    return this.db.waSession
  }

  static async find(ownerId: string): Promise<WaSession | null> {
    return this.delegate.findUnique({ where: { ownerId } }) as Promise<WaSession | null>
  }

  static async upsert(ownerId: string, data: WaSessionData): Promise<WaSession> {
    return this.db.waSession.upsert({
      where: { ownerId },
      create: { ownerId, qr: null, status: "connecting", phone: null, ...data },
      update: data,
    })
  }

  static async clearQr(ownerId: string): Promise<WaSession> {
    return this.delegate.update({
      where: { ownerId },
      data: { qr: null },
    }) as Promise<WaSession>
  }
}
