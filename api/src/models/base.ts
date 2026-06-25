import { prisma } from "@/src/config/db"
import type { PrismaClient } from "@db/client"
import { NotFoundError } from "@/src/utils/errors"

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

  static async getOrThrow<T = any>(id: string, label = "item"): Promise<T> {
    const item = await this.getById<T>(id)
    if (!item) throw new NotFoundError(`${label} not found`)
    return item
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

  protected static paginate(page: number | string, limit: number | string) {
    const p = Number(page)
    const l = Number(limit)
    return { page: p, limit: l, skip: (p - 1) * l }
  }

  protected static listResult<T>(items: T[], total: number, page: number, limit: number) {
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
