import { expect, test, describe, mock, afterEach } from "bun:test"

const mockOrderItemCount = mock((_args: any) => Promise.resolve(0))
const mockProductDeleteMany = mock((_args: any) => Promise.resolve({ count: 1 }))
const mockProductUpdateMany = mock((_args: any) => Promise.resolve({ count: 1 }))
const mockProductFindUniqueOrThrow = mock((_args: any) => Promise.resolve({ id: "p1", name: "Nasi", price: 10000, stock: 5, isAvailable: true, categoryId: null, category: null, description: null, imageUrl: null, createdAt: new Date(), updatedAt: new Date() }))
const mockProductCount = mock((_args: any) => Promise.resolve(0))
const mockCategoryDeleteMany = mock((_args: any) => Promise.resolve({ count: 1 }))
const mockCategoryUpdateMany = mock((_args: any) => Promise.resolve({ count: 1 }))
const mockCategoryFindUniqueOrThrow = mock((_args: any) => Promise.resolve({ id: "c1", name: "Makanan", description: null, _count: { products: 0 } }))

mock.module("@/config/db", () => ({
  prisma: {
    orderItem: { count: mockOrderItemCount },
    product: {
      count: mockProductCount,
      deleteMany: mockProductDeleteMany,
      updateMany: mockProductUpdateMany,
      findUniqueOrThrow: mockProductFindUniqueOrThrow,
      findUnique: mock((_args: any) => null),
      findMany: mock((_args: any) => []),
      update: mock((_args: any) => ({ id: "p1" })),
      create: mock((_args: any) => ({ id: "p1" })),
    },
    category: {
      deleteMany: mockCategoryDeleteMany,
      updateMany: mockCategoryUpdateMany,
      findUniqueOrThrow: mockCategoryFindUniqueOrThrow,
      findUnique: mock((_args: any) => null),
      findMany: mock((_args: any) => []),
      update: mock((_args: any) => ({ id: "c1" })),
      create: mock((_args: any) => ({ id: "c1" })),
    },
  } as any,
}))

import { ProductModel, CategoryModel } from "@/models/catalog"

describe("ProductModel.deleteProduct", () => {
  afterEach(() => {
    mockOrderItemCount.mockClear()
    mockProductDeleteMany.mockClear()
  })

  test("deletes product when no order items reference it", async () => {
    await ProductModel.deleteProduct("owner-1", "prod-1")

    expect(mockOrderItemCount).toHaveBeenCalledWith({ where: { productId: "prod-1" } })
    expect(mockProductDeleteMany).toHaveBeenCalledWith({ where: { id: "prod-1", ownerId: "owner-1" } })
  })

  test("throws BadRequestError when order items exist", async () => {
    mockOrderItemCount.mockImplementationOnce(() => Promise.resolve(3))

    try {
      await ProductModel.deleteProduct("owner-1", "prod-1")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("3 pesanan")
      expect(e.statusCode).toBe(400)
    }

    expect(mockProductDeleteMany).not.toHaveBeenCalled()
  })

  test("does not delete when count query fails", async () => {
    mockOrderItemCount.mockImplementationOnce(() => Promise.reject(new Error("DB error")))

    try {
      await ProductModel.deleteProduct("owner-1", "prod-1")
      expect.unreachable("should have thrown")
    } catch {
      // expected
    }

    expect(mockProductDeleteMany).not.toHaveBeenCalled()
  })

  test("deletes product referenced by zero order items", async () => {
    mockOrderItemCount.mockImplementationOnce(() => Promise.resolve(0))

    await ProductModel.deleteProduct("owner-1", "prod-2")

    expect(mockProductDeleteMany).toHaveBeenCalledWith({ where: { id: "prod-2", ownerId: "owner-1" } })
  })

  test("throws NotFoundError when product belongs to another owner", async () => {
    mockOrderItemCount.mockImplementationOnce(() => Promise.resolve(0))
    mockProductDeleteMany.mockImplementationOnce(() => Promise.resolve({ count: 0 }))

    try {
      await ProductModel.deleteProduct("owner-1", "prod-other")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("product not found")
      expect(e.statusCode).toBe(404)
    }
  })
})

describe("ProductModel.updateProduct", () => {
  afterEach(() => {
    mockProductUpdateMany.mockClear()
    mockProductFindUniqueOrThrow.mockClear()
  })

  test("updates product owned by the requester", async () => {
    await ProductModel.updateProduct("owner-1", "prod-1", { price: 20000 })

    expect(mockProductUpdateMany).toHaveBeenCalledWith({
      where: { id: "prod-1", ownerId: "owner-1" },
      data: { price: 20000, categoryId: undefined },
    })
    expect(mockProductFindUniqueOrThrow).toHaveBeenCalled()
  })

  test("throws NotFoundError when product belongs to another owner", async () => {
    mockProductUpdateMany.mockImplementationOnce(() => Promise.resolve({ count: 0 }))

    try {
      await ProductModel.updateProduct("owner-1", "prod-other", { price: 20000 })
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("product not found")
      expect(e.statusCode).toBe(404)
    }
  })
})

describe("CategoryModel.deleteCategory", () => {
  afterEach(() => {
    mockProductCount.mockClear()
    mockCategoryDeleteMany.mockClear()
  })

  test("deletes category when no products reference it", async () => {
    await CategoryModel.deleteCategory("owner-1", "cat-1")

    expect(mockProductCount).toHaveBeenCalledWith({ where: { categoryId: "cat-1" } })
    expect(mockCategoryDeleteMany).toHaveBeenCalledWith({ where: { id: "cat-1", ownerId: "owner-1" } })
  })

  test("throws BadRequestError when products exist", async () => {
    mockProductCount.mockImplementationOnce(() => Promise.resolve(5))

    try {
      await CategoryModel.deleteCategory("owner-1", "cat-1")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("5 produk")
      expect(e.statusCode).toBe(400)
    }

    expect(mockCategoryDeleteMany).not.toHaveBeenCalled()
  })

  test("deletes empty category", async () => {
    mockProductCount.mockImplementationOnce(() => Promise.resolve(0))

    await CategoryModel.deleteCategory("owner-1", "cat-2")

    expect(mockCategoryDeleteMany).toHaveBeenCalledWith({ where: { id: "cat-2", ownerId: "owner-1" } })
  })

  test("throws NotFoundError when category belongs to another owner", async () => {
    mockProductCount.mockImplementationOnce(() => Promise.resolve(0))
    mockCategoryDeleteMany.mockImplementationOnce(() => Promise.resolve({ count: 0 }))

    try {
      await CategoryModel.deleteCategory("owner-1", "cat-other")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("category not found")
      expect(e.statusCode).toBe(404)
    }
  })
})

describe("CategoryModel.updateCategory", () => {
  afterEach(() => {
    mockCategoryUpdateMany.mockClear()
    mockCategoryFindUniqueOrThrow.mockClear()
  })

  test("updates category owned by the requester", async () => {
    await CategoryModel.updateCategory("owner-1", "cat-1", { name: "Baru" })

    expect(mockCategoryUpdateMany).toHaveBeenCalledWith({
      where: { id: "cat-1", ownerId: "owner-1" },
      data: { name: "Baru" },
    })
    expect(mockCategoryFindUniqueOrThrow).toHaveBeenCalled()
  })

  test("throws NotFoundError when category belongs to another owner", async () => {
    mockCategoryUpdateMany.mockImplementationOnce(() => Promise.resolve({ count: 0 }))

    try {
      await CategoryModel.updateCategory("owner-1", "cat-other", { name: "Baru" })
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("category not found")
      expect(e.statusCode).toBe(404)
    }
  })
})
