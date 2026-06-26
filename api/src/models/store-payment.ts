import { BaseModel } from "@/src/models/base"
import type { StorePaymentMethod } from "@db/client"

export class StorePaymentMethodModel extends BaseModel {
  protected static override get delegate() {
    return this.db.storePaymentMethod
  }

  static async listByStore(storeId = "default"): Promise<StorePaymentMethod[]> {
    return this.delegate.findMany({
      where: { storeId },
      orderBy: { sortOrder: "asc" },
    })
  }

  static async listActive(storeId = "default"): Promise<StorePaymentMethod[]> {
    return this.delegate.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: "asc" },
    })
  }

  static async hasAny(storeId = "default"): Promise<boolean> {
    const count = await this.delegate.count({
      where: { storeId, isActive: true },
    })
    return count > 0
  }
}
