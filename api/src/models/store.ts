import { BaseModel } from "@/src/models/base"
import type { Store } from "@db/client"

export class StoreModel extends BaseModel {
  protected static override get delegate() {
    return this.db.store
  }

  static async find(): Promise<Store> {
    const store = await this.getById<Store>("default")
    if (store) return store
    return this.db.store.create({
      data: { id: "default", businessName: "Toko", phone: "" },
    })
  }

  static async upsert(data: Partial<Store>): Promise<Store> {
    const { id, createdAt, updatedAt, ...rest } = data
    return this.db.store.upsert({
      where: { id: "default" },
      create: { id: "default", businessName: "Toko", phone: "", ...rest },
      update: rest,
    })
  }
}
