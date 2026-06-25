import { BaseModel } from "@/src/models/base"
import type { Prisma, WebSite } from "@db/client"

export class WebSiteModel extends BaseModel {
  protected static override get delegate() {
    return this.db.webSite
  }

  static async getConfig(): Promise<WebSite | null> {
    return this.getById<WebSite>("default")
  }

  static async upsertConfig(config: Record<string, unknown>): Promise<WebSite> {
    const row = await this.getConfig()
    if (!row) {
      return this.db.webSite.create({
        data: {
          id: "default",
          config: config as Prisma.InputJsonValue,
        },
      })
    }
    const merged = { ...(row.config as Record<string, unknown>), ...config }
    return this.db.webSite.update({
      where: { id: "default" },
      data: { config: merged as Prisma.InputJsonValue },
    })
  }

  static async markPublished(): Promise<WebSite> {
    return this.db.webSite.update({
      where: { id: "default" },
      data: { published: true },
    })
  }
}
