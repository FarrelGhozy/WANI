import { BaseModel } from "@/src/models/base"
import type { StorePaymentMethod } from "@db/client"

export class StorePaymentMethodModel extends BaseModel {
  protected static override get delegate() {
    return this.db.storePaymentMethod
  }

  static async listByOwner(ownerId: string): Promise<StorePaymentMethod[]> {
    return this.delegate.findMany({
      where: { ownerId },
      orderBy: { sortOrder: "asc" },
    })
  }

  static async listActive(ownerId: string): Promise<StorePaymentMethod[]> {
    return this.delegate.findMany({
      where: { ownerId, isActive: true },
      orderBy: { sortOrder: "asc" },
    })
  }

  static async hasAny(ownerId: string): Promise<boolean> {
    const count = await this.delegate.count({
      where: { ownerId, isActive: true },
    })
    return count > 0
  }
}
