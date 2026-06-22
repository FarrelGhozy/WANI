import { BaseModel } from "@/src/models/base"
import type { Product, Category } from "@db/client"

function toProductEntry(row: Product & { category?: Category | null }) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    stock: row.stock,
    isAvailable: row.isAvailable,
    categoryName: row.category?.name ?? null,
  }
}

export class ProductModel extends BaseModel {
  protected static override get delegate() {
    return this.db.product
  }

  static async listAvailable(): Promise<ReturnType<typeof toProductEntry>[]> {
    const rows = await this.delegate.findMany({
      where: { isAvailable: true },
      include: { category: true },
      orderBy: { name: "asc" },
    })
    return rows.map(toProductEntry)
  }

  static async findByNames(names: string[]): Promise<Map<string, Product & { category?: Category | null }>> {
    const lower = names.map((n) => n.toLowerCase())
    const rows = await this.delegate.findMany({
      include: { category: true },
    })
    const map = new Map<string, Product & { category?: Category | null }>()
    for (const row of rows) {
      const key = row.name.toLowerCase()
      if (lower.includes(key)) {
        map.set(key, row)
      }
    }
    return map
  }

  static async listAll(): Promise<Product[]> {
    return this.delegate.findMany({ include: { category: true } }) as Promise<Product[]>
  }
}

export class CategoryModel extends BaseModel {
  protected static override get delegate() {
    return this.db.category
  }
}
