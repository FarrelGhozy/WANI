import { BaseModel } from "@/src/models/base"
import type { WaSession } from "@db/client"
import type { WaSessionData } from "@/src/types/wa-session"

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

  static async findActive(): Promise<string[]> {
    const rows = await this.delegate.findMany({
      where: { status: { not: "disconnected" } },
      select: { ownerId: true },
    }) as { ownerId: string }[]
    return rows.map(r => r.ownerId)
  }
}
