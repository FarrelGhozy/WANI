import { BaseModel } from "@/models/base";
import type { StorePaymentMethod } from "@db/client";
import { NotFoundError } from "@/utils/errors";

export class StorePaymentMethodModel extends BaseModel {
  protected static override get delegate() {
    return this.db.storePaymentMethod;
  }

  static async listByOwner(ownerId: string): Promise<StorePaymentMethod[]> {
    return this.delegate.findMany({
      where: { ownerId },
      orderBy: { sortOrder: "asc" },
    });
  }

  static async listActive(ownerId: string): Promise<StorePaymentMethod[]> {
    return this.delegate.findMany({
      where: { ownerId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  static async hasAny(ownerId: string): Promise<boolean> {
    const count = await this.delegate.count({
      where: { ownerId, isActive: true },
    });
    return count > 0;
  }

  static async countByType(ownerId: string, type: string): Promise<number> {
    return this.delegate.count({ where: { ownerId, type } });
  }

  static async getOwnedOrThrow(
    ownerId: string,
    id: string
  ): Promise<StorePaymentMethod> {
    const method = await this.delegate.findFirst({ where: { id, ownerId } });
    if (!method) throw new NotFoundError("payment method not found");
    return method as StorePaymentMethod;
  }

  static async updateOwned(
    ownerId: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<StorePaymentMethod> {
    await this.getOwnedOrThrow(ownerId, id);
    return this.delegate.update({
      where: { id, ownerId },
      data,
    }) as Promise<StorePaymentMethod>;
  }

  static async deleteOwned(ownerId: string, id: string): Promise<void> {
    await this.getOwnedOrThrow(ownerId, id);
    await this.delegate.delete({ where: { id, ownerId } });
  }
}
