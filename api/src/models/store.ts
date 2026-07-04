import { BaseModel } from "@/src/models/base"
import type { Store } from "@db/client"

export class StoreModel extends BaseModel {
  protected static override get delegate() {
    return this.db.store
  }

  static async findByOwner(ownerId: string): Promise<Store | null> {
    return this.delegate.findUnique({ where: { ownerId } })
  }

  static async upsertByOwner(ownerId: string, data: Partial<Store>): Promise<Store> {
    const { ownerId: _, id, createdAt, updatedAt, ...rest } = data as Record<string, unknown>
    return this.db.store.upsert({
      where: { ownerId },
      create: { ownerId, businessName: "Toko", phone: "", ...rest } as any,
      update: rest as any,
    })
  }
}
