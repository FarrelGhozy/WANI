import { BaseModel } from "@/src/models/base"
import type { AiConfig } from "@db/client"

function normalize(row: AiConfig | null): AiConfig | null {
  if (!row) return null
  return {
    ...row,
    temperature: Number(row.temperature),
  } as unknown as AiConfig
}

export class AiConfigModel extends BaseModel {
  protected static override get delegate() {
    return this.db.aiConfig
  }

  static async find(): Promise<AiConfig | null> {
    const row = await this.getById<AiConfig>("default")
    return normalize(row)
  }

  static async upsert(data: Omit<Partial<AiConfig>, "temperature"> & { temperature?: number }): Promise<AiConfig> {
    const { id, createdAt, updatedAt, temperature, ...rest } = data as any
    const row = await this.db.aiConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        systemPrompt: "",
        model: "opencode/deepseek-v4-flash-free",
        maxTokens: 2048,
        temperature: temperature ?? 0.7,
        ...rest,
      },
      update: {
        ...rest,
        ...(temperature !== undefined ? { temperature } : {}),
      },
    })
    return normalize(row)!
  }
}
