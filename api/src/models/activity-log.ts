import { BaseModel } from "@/src/models/base"

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
}
