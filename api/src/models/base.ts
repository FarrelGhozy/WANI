import { prisma } from "@/src/config/db"
import type { PrismaClient } from "@db/client"

export abstract class BaseModel {
  protected static get db(): PrismaClient {
    return prisma
  }

  protected static get delegate(): any {
    throw new Error("delegate getter must be overridden")
  }

  static async getAll<T = any>(): Promise<T[]> {
    return this.delegate.findMany()
  }

  static async getById<T = any>(id: string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } })
  }

  static async create<T = any>(data: Record<string, unknown>): Promise<T> {
    return this.delegate.create({ data })
  }

  static async update<T = any>(
    id: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    return this.delegate.update({ where: { id }, data })
  }

  static async delete(id: string): Promise<void> {
    await this.delegate.delete({ where: { id } })
  }
}
