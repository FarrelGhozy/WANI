import { BaseModel } from "@/src/models/base"

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
        metadata: (metadata ?? undefined) as any,
      },
    })
  }

  static async list(params: {
    page: number
    limit: number
    type?: string
    referenceId?: string
    dateFrom?: string
    dateTo?: string
    sort: string
    order: string
  }): Promise<LogListResult> {
    const where: Record<string, unknown> = {}

    if (params.type) where.type = params.type
    if (params.referenceId) where.referenceId = params.referenceId
    if (params.dateFrom || params.dateTo) {
      const createdAt: Record<string, string> = {}
      if (params.dateFrom) createdAt.gte = params.dateFrom
      if (params.dateTo) createdAt.lte = params.dateTo
      where.createdAt = createdAt
    }

    const skip = (params.page - 1) * params.limit

    const [rows, total] = await Promise.all([
      this.delegate.findMany({
        where: where as any,
        skip,
        take: params.limit,
        orderBy: { createdAt: params.order },
      }),
      this.delegate.count({ where: where as any }),
    ])

    return {
      items: rows.map((r: any) => ({
        id: r.id,
        type: r.type,
        referenceId: r.referenceId ?? null,
        description: r.description,
        metadata: r.metadata as Record<string, unknown> | null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    }
  }
}
