import { BaseModel } from "@/src/models/base"
import type { Prisma, WebSite, WebsiteGeneration } from "@db/client"

export class WebSiteModel extends BaseModel {
  protected static override get delegate() {
    return this.db.webSite
  }

  static async getByOwner(ownerId: string): Promise<WebSite | null> {
    return this.delegate.findUnique({ where: { ownerId } })
  }

  static async upsertByOwner(ownerId: string, config: Record<string, unknown>): Promise<WebSite> {
    const existing = await this.getByOwner(ownerId)
    if (!existing) {
      return this.db.webSite.create({
        data: {
          ownerId,
          config: config as Prisma.InputJsonValue,
        },
      })
    }
    const merged = { ...(existing.config as Record<string, unknown>), ...config }
    return this.db.webSite.update({
      where: { ownerId },
      data: { config: merged as Prisma.InputJsonValue },
    })
  }

  static async markPublished(ownerId: string): Promise<WebSite> {
    return this.db.webSite.update({
      where: { ownerId },
      data: { published: true },
    })
  }

  // ── WebsiteGeneration ──

  static async createGeneration(
    ownerId: string,
    data: {
      slug: string
      status: string
      productCount: number
      message: string
    },
  ): Promise<WebsiteGeneration> {
    return this.db.websiteGeneration.create({ data: { ...data, ownerId } })
  }

  static async listGenerations(ownerId: string): Promise<WebsiteGeneration[]> {
    return this.db.websiteGeneration.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    })
  }

  static async getLatestGeneration(ownerId: string): Promise<WebsiteGeneration | null> {
    return this.db.websiteGeneration.findFirst({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    })
  }

  static async getGenerationById(id: string): Promise<WebsiteGeneration | null> {
    return this.db.websiteGeneration.findUnique({ where: { id } })
  }

  static async getGenerationByOwnerSlug(ownerId: string, slug: string): Promise<WebsiteGeneration | null> {
    return this.db.websiteGeneration.findUnique({ where: { ownerId_slug: { ownerId, slug } } })
  }

  static async deleteGeneration(id: string): Promise<void> {
    await this.db.websiteGeneration.delete({ where: { id } })
  }
}
