import { BaseModel } from "@/src/models/base"
import type { Prisma, WebSite, WebsiteGeneration } from "@db/client"

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

  // ── WebsiteGeneration ──

  static async createGeneration(data: {
    slug: string
    status: string
    productCount: number
    message: string
  }): Promise<WebsiteGeneration> {
    return this.db.websiteGeneration.create({ data })
  }

  static async listGenerations(): Promise<WebsiteGeneration[]> {
    return this.db.websiteGeneration.findMany({
      orderBy: { createdAt: "desc" },
    })
  }

  static async getLatestGeneration(): Promise<WebsiteGeneration | null> {
    return this.db.websiteGeneration.findFirst({
      orderBy: { createdAt: "desc" },
    })
  }

  static async getGenerationById(id: string): Promise<WebsiteGeneration | null> {
    return this.db.websiteGeneration.findUnique({ where: { id } })
  }

  static async getGenerationBySlug(slug: string): Promise<WebsiteGeneration | null> {
    return this.db.websiteGeneration.findUnique({ where: { slug } })
  }

  static async deleteGeneration(id: string): Promise<void> {
    await this.db.websiteGeneration.delete({ where: { id } })
  }
}
