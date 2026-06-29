import { expect, test, describe, mock, afterEach } from "bun:test"

const mockOrderItemCount = mock((_args: any) => Promise.resolve(0))
const mockProductDelete = mock((_args: any) => Promise.resolve())
const mockProductCount = mock((_args: any) => Promise.resolve(0))
const mockCategoryDelete = mock((_args: any) => Promise.resolve())

mock.module("@/src/config/db", () => ({
  prisma: {
    orderItem: { count: mockOrderItemCount },
    product: {
      count: mockProductCount,
      delete: mockProductDelete,
      findUnique: mock((_args: any) => null),
      findMany: mock((_args: any) => []),
      update: mock((_args: any) => ({ id: "p1" })),
      create: mock((_args: any) => ({ id: "p1" })),
    },
    category: {
      delete: mockCategoryDelete,
      findUnique: mock((_args: any) => null),
      findMany: mock((_args: any) => []),
      update: mock((_args: any) => ({ id: "c1" })),
      create: mock((_args: any) => ({ id: "c1" })),
    },
  } as any,
}))

import { ProductModel, CategoryModel } from "@/src/models/catalog"

describe("ProductModel.deleteProduct", () => {
  afterEach(() => {
    mockOrderItemCount.mockClear()
    mockProductDelete.mockClear()
  })

  test("deletes product when no order items reference it", async () => {
    await ProductModel.deleteProduct("prod-1")

    expect(mockOrderItemCount).toHaveBeenCalledWith({ where: { productId: "prod-1" } })
    expect(mockProductDelete).toHaveBeenCalledWith({ where: { id: "prod-1" } })
  })

  test("throws BadRequestError when order items exist", async () => {
    mockOrderItemCount.mockImplementationOnce(() => Promise.resolve(3))

    try {
      await ProductModel.deleteProduct("prod-1")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("3 pesanan")
      expect(e.statusCode).toBe(400)
    }

    expect(mockProductDelete).not.toHaveBeenCalled()
  })

  test("does not delete when count query fails", async () => {
    mockOrderItemCount.mockImplementationOnce(() => Promise.reject(new Error("DB error")))

    try {
      await ProductModel.deleteProduct("prod-1")
      expect.unreachable("should have thrown")
    } catch {
      // expected
    }

    expect(mockProductDelete).not.toHaveBeenCalled()
  })

  test("deletes product referenced by zero order items", async () => {
    mockOrderItemCount.mockImplementationOnce(() => Promise.resolve(0))

    await ProductModel.deleteProduct("prod-2")

    expect(mockProductDelete).toHaveBeenCalledWith({ where: { id: "prod-2" } })
  })
})

describe("CategoryModel.deleteCategory", () => {
  afterEach(() => {
    mockProductCount.mockClear()
    mockCategoryDelete.mockClear()
  })

  test("deletes category when no products reference it", async () => {
    await CategoryModel.deleteCategory("cat-1")

    expect(mockProductCount).toHaveBeenCalledWith({ where: { categoryId: "cat-1" } })
    expect(mockCategoryDelete).toHaveBeenCalledWith({ where: { id: "cat-1" } })
  })

  test("throws BadRequestError when products exist", async () => {
    mockProductCount.mockImplementationOnce(() => Promise.resolve(5))

    try {
      await CategoryModel.deleteCategory("cat-1")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("5 produk")
      expect(e.statusCode).toBe(400)
    }

    expect(mockCategoryDelete).not.toHaveBeenCalled()
  })

  test("deletes empty category", async () => {
    mockProductCount.mockImplementationOnce(() => Promise.resolve(0))

    await CategoryModel.deleteCategory("cat-2")

    expect(mockCategoryDelete).toHaveBeenCalledWith({ where: { id: "cat-2" } })
  })
})
