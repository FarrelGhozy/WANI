import { BaseModel } from "@/src/models/base"
import type { Product, Category } from "@db/client"

export type ProductResponse = {
  id: string
  categoryId: string | null
  category: { id: string; name: string } | null
  name: string
  description: string | null
  price: number
  stock: number
  isAvailable: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type ProductListResult = {
  items: ProductResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type CategoryResponse = {
  id: string
  name: string
  description: string | null
  productCount: number
}

function toProductResponse(
  row: Product & { category?: Category | null },
): ProductResponse {
  return {
    id: row.id,
    categoryId: row.categoryId ?? null,
    category: row.category ? { id: row.category.id, name: row.category.name } : null,
    name: row.name,
    description: row.description ?? null,
    price: Number(row.price),
    stock: row.stock,
    isAvailable: row.isAvailable,
    imageUrl: row.imageUrl ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toCategoryResponse(
  row: Category & { _count?: { products: number } },
): CategoryResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    productCount: row._count?.products ?? 0,
  }
}

export class ProductModel extends BaseModel {
  protected static override get delegate() {
    return this.db.product
  }

  static async listAvailable(): Promise<ReturnType<typeof toProductResponse>[]> {
    const rows = await this.delegate.findMany({
      where: { isAvailable: true },
      include: { category: true },
      orderBy: { name: "asc" },
    })
    return rows.map(toProductResponse)
  }

  static async findByNames(names: string[]): Promise<Map<string, Product & { category?: Category | null }>> {
    const rows = await this.delegate.findMany({
      where: { name: { in: names, mode: "insensitive" } },
      include: { category: true },
    })
    const map = new Map<string, Product & { category?: Category | null }>()
    for (const row of rows) {
      map.set(row.name.toLowerCase(), row)
    }
    return map
  }

  static async listAll(): Promise<ProductResponse[]> {
    const rows = await this.delegate.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    })
    return rows.map(toProductResponse)
  }

  static async list(params: {
    page: number | string
    limit: number | string
    search?: string
    categoryId?: string
    isAvailable?: boolean | string
    sort: string
    order: string
  }): Promise<ProductListResult> {
    const { page, limit, skip } = this.paginate(params.page, params.limit)
    const where: Record<string, unknown> = {}

    if (params.search) {
      where.name = { contains: params.search, mode: "insensitive" }
    }
    if (params.categoryId) {
      where.categoryId = params.categoryId
    }
    if (params.isAvailable !== undefined) {
      where.isAvailable = params.isAvailable === "true" || params.isAvailable === true
    }

    const [rows, total] = await Promise.all([
      this.delegate.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { [params.sort]: params.order },
      }),
      this.delegate.count({ where }),
    ])

    return this.listResult(rows.map(toProductResponse), total, page, limit)
  }

  static async getByIdWithCategory(id: string): Promise<ProductResponse | null> {
    const row = await this.delegate.findUnique({
      where: { id },
      include: { category: true },
    })
    return row ? toProductResponse(row) : null
  }

  static async createProduct(data: {
    name: string
    categoryId?: string | null
    description?: string | null
    price: number
    stock?: number
    isAvailable?: boolean
    imageUrl?: string | null
  }): Promise<ProductResponse> {
    const row = await this.delegate.create({
      data: {
        name: data.name,
        categoryId: data.categoryId ?? null,
        description: data.description ?? null,
        price: data.price,
        stock: data.stock ?? 0,
        isAvailable: data.isAvailable ?? true,
        imageUrl: data.imageUrl ?? null,
      },
      include: { category: true },
    })
    return toProductResponse(row)
  }

  static async updateProduct(
    id: string,
    data: {
      name?: string
      categoryId?: string | null
      description?: string | null
      price?: number
      stock?: number
      isAvailable?: boolean
      imageUrl?: string | null
    },
  ): Promise<ProductResponse> {
    const row = await this.delegate.update({
      where: { id },
      data: {
        ...data,
        categoryId: data.categoryId === undefined ? undefined : data.categoryId,
      },
      include: { category: true },
    })
    return toProductResponse(row)
  }

  static async deleteProduct(id: string): Promise<void> {
    await this.delegate.delete({ where: { id } })
  }
}

export class CategoryModel extends BaseModel {
  protected static override get delegate() {
    return this.db.category
  }

  static async listAll(): Promise<CategoryResponse[]> {
    const rows = await this.delegate.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    })
    return rows.map(toCategoryResponse)
  }

  static async getByIdWithCount(id: string): Promise<CategoryResponse | null> {
    const row = await this.delegate.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    return row ? toCategoryResponse(row) : null
  }

  static async createCategory(data: {
    name: string
    description?: string | null
  }): Promise<CategoryResponse> {
    const row = await this.delegate.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      include: { _count: { select: { products: true } } },
    })
    return toCategoryResponse(row)
  }

  static async updateCategory(
    id: string,
    data: { name?: string; description?: string | null },
  ): Promise<CategoryResponse> {
    const row = await this.delegate.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    })
    return toCategoryResponse(row)
  }

  static async deleteCategory(id: string): Promise<void> {
    await this.delegate.delete({ where: { id } })
  }
}
