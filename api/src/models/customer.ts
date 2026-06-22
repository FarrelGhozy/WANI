import { BaseModel } from "@/src/models/base"
import type { Customer } from "@db/client"

export class CustomerModel extends BaseModel {
  protected static override get delegate() {
    return this.db.customer
  }

  static async upsertByPhone(phone: string, name?: string): Promise<Customer> {
    const existing = await this.delegate.findUnique({ where: { phone } })
    if (existing) {
      if (name && existing.name !== name) {
        return this.delegate.update({
          where: { phone },
          data: { name },
        })
      }
      return existing
    }
    return this.delegate.create({
      data: { phone, name: name ?? phone },
    })
  }

  static async incrementOrders(id: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { totalOrders: { increment: 1 } },
    })
  }
}
