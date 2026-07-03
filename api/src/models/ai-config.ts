import { BaseModel } from "@/src/models/base"
import type { AiConfig } from "@db/client"

function normalize(row: AiConfig | null): AiConfig | null {
  if (!row) return null
  return { ...row }
}

export class AiConfigModel extends BaseModel {
  protected static override get delegate() {
    return this.db.aiConfig
  }

  static async find(): Promise<AiConfig> {
    let row = await this.getById<AiConfig>("default")
    if (!row) {
      row = await this.db.aiConfig.create({
        data: {
          id: "default",
          systemPrompt: "",
          model: "deepseek-v4-flash-free",
          maxTokens: 2048,
          temperature: 0.7,
        },
      })
    }
    return normalize(row)!
  }

  static async upsert(data: Omit<Partial<AiConfig>, "temperature"> & { temperature?: number }): Promise<AiConfig> {
    const { id, createdAt, updatedAt, temperature, ...rest } = data
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
