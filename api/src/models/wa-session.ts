import { BaseModel } from "@/src/models/base"
import type { WaSession, WaSessionData } from "@/src/types/wa-session"

export class WaSessionModel extends BaseModel {
  protected static override get delegate() {
    return this.db.waSession
  }

  static async find(): Promise<WaSession | null> {
    return this.getById<WaSession>("default")
  }

  static async upsert(data: WaSessionData): Promise<WaSession> {
    return this.db.waSession.upsert({
      where: { id: "default" },
      create: { id: "default", qr: null, status: "connecting", phone: null, ...data },
      update: data,
    })
  }

  static async clearQr(): Promise<WaSession> {
    return this.update<WaSession>("default", { qr: null })
  }
}
