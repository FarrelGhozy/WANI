import { BaseModel } from "@/src/models/base"
import type { Prisma } from "@db/client"

export type LogEntry = {
  id: string
  type: string
  referenceId: string | null
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type LogListResult = {
  items: LogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class ActivityLogModel extends BaseModel {
  protected static override get delegate() {
    return this.db.activityLog
  }

  static async log(
    type: string,
    description: string,
    referenceId?: string | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<void> {
    await this.delegate.create({
      data: {
        type,
        description,
        referenceId: referenceId ?? null,
        metadata: metadata as Prisma.InputJsonValue,
      },
    })
  }

  static async list(params: {
    page: number | string
    limit: number | string
    type?: string
    referenceId?: string
    dateFrom?: string
    dateTo?: string
    sort: string
    order: "asc" | "desc"
  }): Promise<LogListResult> {
    const { page, limit, skip } = this.paginate(params.page, params.limit)
    const where: Record<string, unknown> = {}

    if (params.type) where.type = params.type
    if (params.referenceId) where.referenceId = params.referenceId
    if (params.dateFrom || params.dateTo) {
      const createdAt: Record<string, string> = {}
      if (params.dateFrom) createdAt.gte = params.dateFrom
      if (params.dateTo) createdAt.lte = params.dateTo
      where.createdAt = createdAt
    }

    const w = where as Prisma.ActivityLogWhereInput
    const [rows, total] = await Promise.all([
      this.delegate.findMany({ where: w, skip, take: limit, orderBy: { createdAt: params.order } }),
      this.delegate.count({ where: w }),
    ])

    return this.listResult(
      rows.map((r: Prisma.ActivityLogModel) => ({
        id: r.id,
        type: r.type,
        referenceId: r.referenceId ?? null,
        description: r.description,
        metadata: r.metadata as Record<string, unknown> | null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    )
  }
}
