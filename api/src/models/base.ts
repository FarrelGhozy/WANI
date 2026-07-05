import { prisma } from "@/src/config/db"
import type { PrismaClient } from "@db/client"
import { NotFoundError } from "@/src/utils/errors"

interface PrismaDelegate {
  findMany(args?: unknown): Promise<unknown[]>
  findUnique(args: unknown): Promise<unknown | null>
  findFirst(args?: unknown): Promise<unknown | null>
  findUniqueOrThrow(args: unknown): Promise<unknown>
  create(args: unknown): Promise<unknown>
  update(args: unknown): Promise<unknown>
  delete(args: unknown): Promise<unknown>
  count(args?: unknown): Promise<number>
  upsert(args: unknown): Promise<unknown>
}

export abstract class BaseModel {
  protected static get db(): PrismaClient {
    return prisma
  }

  protected static get delegate(): PrismaDelegate {
    throw new Error("delegate getter must be overridden")
  }

  static async getAll<T = unknown>(): Promise<T[]> {
    return this.delegate.findMany() as Promise<T[]>
  }

  static async getById<T = unknown>(id: string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } }) as Promise<T | null>
  }

  static async getOrThrow<T = unknown>(id: string, label = "item"): Promise<T> {
    const item = await this.getById<T>(id)
    if (!item) throw new NotFoundError(`${label} not found`)
    return item
  }

  static async create<T = unknown>(data: Record<string, unknown>): Promise<T> {
    return this.delegate.create({ data }) as Promise<T>
  }

  static async update<T = unknown>(
    id: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    return this.delegate.update({ where: { id }, data }) as Promise<T>
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

  protected static async findManyPaginated<T>(
    where: Record<string, unknown>,
    skip: number,
    take: number,
    orderBy: Record<string, string>,
    page: number,
    limit: number,
  ): Promise<{ items: T[]; total: number; page: number; limit: number; totalPages: number }> {
    const [rows, total] = await Promise.all([
      this.delegate.findMany({ where, skip, take, orderBy }),
      this.delegate.count({ where }),
    ])
    return this.listResult(rows as T[], total, page, limit)
  }
}
