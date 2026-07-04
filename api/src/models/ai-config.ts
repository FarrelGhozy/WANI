import { BaseModel } from "@/src/models/base"
import type { AiConfig, Prisma } from "@db/client"

export class AiConfigModel extends BaseModel {
  protected static override get delegate() {
    return this.db.aiConfig
  }

  static async findByOwner(ownerId: string): Promise<AiConfig | null> {
    return this.delegate.findUnique({ where: { ownerId } })
  }

  static async upsertByOwner(
    ownerId: string,
    data: Omit<Partial<AiConfig>, "temperature"> & { temperature?: number },
  ): Promise<AiConfig> {
    const { ownerId: _, id, createdAt, updatedAt, temperature, ...rest } = data as Record<string, unknown>
    return this.db.aiConfig.upsert({
      where: { ownerId },
      create: {
        ownerId,
        systemPrompt: "",
        model: "opencode/deepseek-v4-flash-free",
        maxTokens: 2048,
        temperature: (temperature as number) ?? 0.7,
        ...rest,
      } as Prisma.AiConfigCreateInput,
      update: {
        ...rest,
        ...(temperature !== undefined ? { temperature } : {}),
      } as Prisma.AiConfigUpdateInput,
    })
  }
}
