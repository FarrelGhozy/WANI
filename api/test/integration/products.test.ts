import { expect, test, describe, beforeEach, mock } from "bun:test"

const mockProductFindMany = mock((_args: any) => Promise.resolve([]))
const mockProductFindUnique = mock((_args: any) => Promise.resolve(null))
const mockProductCreate = mock((_args: any) => Promise.resolve({}))
const mockProductUpdate = mock((_args: any) => Promise.resolve({}))
const mockProductDelete = mock((_args: any) => Promise.resolve({}))
const mockProductCount = mock((_args: any) => Promise.resolve(0))
const mockOrderItemCount = mock((_args: any) => Promise.resolve(0))
const mockCategoryFindMany = mock((_args: any) => Promise.resolve([]))
const mockCategoryFindUnique = mock((_args: any) => Promise.resolve(null))
const mockCategoryCreate = mock((_args: any) => Promise.resolve({}))
const mockCategoryUpdate = mock((_args: any) => Promise.resolve({}))
const mockCategoryDelete = mock((_args: any) => Promise.resolve({}))
const mockCategoryCount = mock((_args: any) => Promise.resolve(0))

mock.module("@/src/config/db", () => ({
  prisma: {
    product: {
      findMany: mockProductFindMany,
      findUnique: mockProductFindUnique,
      create: mockProductCreate,
      update: mockProductUpdate,
      delete: mockProductDelete,
      count: mockProductCount,
      findUniqueOrThrow: mock((_args: any) => Promise.resolve({})),
    },
    category: {
      findMany: mockCategoryFindMany,
      findUnique: mockCategoryFindUnique,
      create: mockCategoryCreate,
      update: mockCategoryUpdate,
      delete: mockCategoryDelete,
      count: mockCategoryCount,
    },
    orderItem: {
      count: mockOrderItemCount,
    },
    $transaction: mock((fn: any) => fn({})),
  } as any,
}))

process.env.JWT_SECRET = "test-jwt-secret"

import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  listCategories, createCategory, deleteCategory,
} from "@/src/controllers/product"
import type { Request } from "express"

function mockReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, params: {}, query: {}, headers: {}, user: undefined, ...overrides } as Request
}

function mockRes() {
  let statusCode = 200
  let body: unknown
  return {
    status: (code: number) => { statusCode = code; return { json: (data: unknown) => { body = data } } },
    getStatus: () => statusCode,
    getBody: () => body as any,
  }
}

function defaultVQ(overrides: Record<string, unknown> = {}) {
  return { page: "1", limit: "20", search: "", sort: "name", order: "asc", ...overrides }
}

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1", name: "Nasi Goreng", price: 25000, stock: 10, isAvailable: true,
    categoryId: "c1", category: { id: "c1", name: "Makanan", description: null },
    description: null, imageUrl: null, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  }
}

describe("GET /api/products", () => {
  beforeEach(() => {
    mockProductFindMany.mockReset()
    mockProductCount.mockReset()
  })

  test("lists products with pagination", async () => {
    mockProductCount.mockResolvedValueOnce(2)
    mockProductFindMany.mockResolvedValueOnce([makeProduct(), makeProduct({ id: "p2", name: "Es Teh" })])

    const req = mockReq({ validatedQuery: defaultVQ() } as any)
    const res = mockRes()

    await listProducts(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    expect(res.getBody().data.items).toHaveLength(2)
    expect(res.getBody().data.total).toBe(2)
  })

  test("searches products by name", async () => {
    mockProductCount.mockResolvedValueOnce(1)
    mockProductFindMany.mockResolvedValueOnce([makeProduct()])

    const req = mockReq({ validatedQuery: defaultVQ({ search: "nasi" }) } as any)
    const res = mockRes()

    await listProducts(req as any, res as any)

    expect(res.getBody().data.items).toHaveLength(1)
  })
})

describe("GET /api/products/:id", () => {
  test("returns a single product", async () => {
    mockProductFindUnique.mockReset()
    mockProductFindUnique.mockResolvedValueOnce(makeProduct())

    const req = mockReq({ params: { id: "p1" } })
    const res = mockRes()

    await getProduct(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    expect(res.getBody().data.name).toBe("Nasi Goreng")
  })

  test("returns 404 for unknown product", async () => {
    mockProductFindUnique.mockReset()
    mockProductFindUnique.mockResolvedValueOnce(null)

    const req = mockReq({ params: { id: "unknown" } })
    const res = mockRes()

    try {
      await getProduct(req as any, res as any)
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.statusCode).toBe(404)
    }
  })
})

describe("POST /api/products", () => {
  test("creates a new product", async () => {
    mockProductCreate.mockReset()
    mockProductCreate.mockResolvedValueOnce(makeProduct({ id: "p3", name: "Ayam Goreng" }))

    const req = mockReq({
      body: { name: "Ayam Goreng", price: 15000, categoryId: "c1" },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    await createProduct(req as any, res as any)

    expect(res.getStatus()).toBe(201)
    expect(res.getBody().data.name).toBe("Ayam Goreng")
  })
})

describe("PUT /api/products/:id", () => {
  test("updates a product", async () => {
    mockProductFindUnique.mockReset()
    mockProductUpdate.mockReset()
    mockProductFindUnique.mockResolvedValueOnce(makeProduct())
    mockProductUpdate.mockResolvedValueOnce(makeProduct({ name: "Nasi Goreng Spesial", price: 30000 }))

    const req = mockReq({
      params: { id: "p1" },
      body: { name: "Nasi Goreng Spesial", price: 30000 },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    await updateProduct(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    expect(res.getBody().data.name).toBe("Nasi Goreng Spesial")
  })
})

describe("DELETE /api/products/:id", () => {
  test("deletes product with no order references", async () => {
    mockProductFindUnique.mockReset()
    mockOrderItemCount.mockReset()
    mockProductDelete.mockReset()

    mockProductFindUnique.mockResolvedValueOnce(makeProduct())
    mockOrderItemCount.mockResolvedValueOnce(0)
    mockProductDelete.mockResolvedValueOnce(makeProduct())

    const req = mockReq({
      params: { id: "p1" },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    await deleteProduct(req as any, res as any)

    expect(res.getStatus()).toBe(200)
  })

  test("rejects delete when product has order references", async () => {
    mockProductFindUnique.mockReset()
    mockOrderItemCount.mockReset()
    mockProductFindUnique.mockResolvedValueOnce(makeProduct())
    mockOrderItemCount.mockResolvedValueOnce(3)

    const req = mockReq({
      params: { id: "p1" },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    try {
      await deleteProduct(req as any, res as any)
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.statusCode).toBe(400)
      expect(e.message).toContain("3 pesanan")
    }
  })
})

describe("GET /api/products/categories", () => {
  test("lists categories", async () => {
    mockCategoryFindMany.mockReset()
    mockCategoryFindMany.mockResolvedValueOnce([
      { id: "c1", name: "Makanan", description: null, _count: { products: 5 } },
      { id: "c2", name: "Minuman", description: null, _count: { products: 3 } },
    ])

    const req = mockReq()
    const res = mockRes()

    await listCategories(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    expect(res.getBody().data.items).toHaveLength(2)
    expect(res.getBody().data.items[0].productCount).toBe(5)
    expect(res.getBody().data.items[1].productCount).toBe(3)
  })
})

describe("POST /api/products/categories", () => {
  test("creates a category", async () => {
    mockCategoryCreate.mockReset()
    mockCategoryCreate.mockResolvedValueOnce({ id: "c3", name: "Snack", description: null })

    const req = mockReq({
      body: { name: "Snack" },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    await createCategory(req as any, res as any)

    expect(res.getStatus()).toBe(201)
    expect(res.getBody().data.name).toBe("Snack")
  })
})

describe("DELETE /api/products/categories/:id", () => {
  test("deletes empty category", async () => {
    mockCategoryFindUnique.mockReset()
    mockProductCount.mockReset()
    mockCategoryDelete.mockReset()

    mockCategoryFindUnique.mockResolvedValueOnce({ id: "c1", name: "Old" })
    mockProductCount.mockResolvedValueOnce(0)
    mockCategoryDelete.mockResolvedValueOnce({ id: "c1" })

    const req = mockReq({
      params: { id: "c1" },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    await deleteCategory(req as any, res as any)

    expect(res.getStatus()).toBe(200)
  })
})
