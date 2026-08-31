import { expect, test, describe, mock, afterEach } from "bun:test";

const mockOrderItemCount = mock((_args: any) => Promise.resolve(0));
const mockProductDelete = mock((_args: any) => Promise.resolve());
const mockProductCount = mock((_args: any) => Promise.resolve(0));
const mockCategoryDelete = mock((_args: any) => Promise.resolve());
const mockProductUpdate = mock((_args: any) => Promise.resolve({ id: "p1" }));
const mockCategoryUpdate = mock((_args: any) => Promise.resolve({ id: "c1" }));
const mockProductFindFirst = mock((_args: any) =>
  Promise.resolve({
    id: "prod-1",
    ownerId: "owner-1",
    categoryId: null,
    category: null,
    name: "Product",
    description: null,
    price: 1000,
    stock: 1,
    isAvailable: true,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
);
const mockCategoryFindFirst = mock((_args: any) =>
  Promise.resolve({
    id: "cat-1",
    ownerId: "owner-1",
    name: "Category",
    description: null,
    createdAt: new Date(),
    _count: { products: 0 },
  })
);

mock.module("@/config/db", () => ({
  prisma: {
    orderItem: { count: mockOrderItemCount },
    product: {
      count: mockProductCount,
      delete: mockProductDelete,
      findFirst: mockProductFindFirst,
      findUnique: mock((_args: any) => null),
      findMany: mock((_args: any) => []),
      update: mockProductUpdate,
      create: mock((_args: any) => ({ id: "p1" })),
    },
    category: {
      delete: mockCategoryDelete,
      findFirst: mockCategoryFindFirst,
      findUnique: mock((_args: any) => null),
      findMany: mock((_args: any) => []),
      update: mockCategoryUpdate,
      create: mock((_args: any) => ({ id: "c1" })),
    },
  } as any,
}));

import { ProductModel, CategoryModel } from "@/models/catalog";

describe("owner-scoped updates", () => {
  afterEach(() => {
    mockProductFindFirst.mockClear();
    mockCategoryFindFirst.mockClear();
    mockProductUpdate.mockClear();
    mockCategoryUpdate.mockClear();
  });

  test("does not update a product owned by another tenant", async () => {
    mockProductFindFirst.mockImplementationOnce(() => Promise.resolve(null));

    await expect(
      ProductModel.updateProduct("owner-1", "foreign-product", { name: "X" })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockProductUpdate).not.toHaveBeenCalled();
  });

  test("does not update a category owned by another tenant", async () => {
    mockCategoryFindFirst.mockImplementationOnce(() => Promise.resolve(null));

    await expect(
      CategoryModel.updateCategory("owner-1", "foreign-category", {
        name: "X",
      })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockCategoryUpdate).not.toHaveBeenCalled();
  });
});

describe("ProductModel.deleteProduct", () => {
  afterEach(() => {
    mockOrderItemCount.mockClear();
    mockProductDelete.mockClear();
    mockProductFindFirst.mockClear();
  });

  test("deletes product when no order items reference it", async () => {
    await ProductModel.deleteProduct("owner-1", "prod-1");

    expect(mockOrderItemCount).toHaveBeenCalledWith({
      where: { productId: "prod-1" },
    });
    expect(mockProductDelete).toHaveBeenCalledWith({
      where: { id: "prod-1", ownerId: "owner-1" },
    });
  });

  test("throws BadRequestError when order items exist", async () => {
    mockOrderItemCount.mockImplementationOnce(() => Promise.resolve(3));

    try {
      await ProductModel.deleteProduct("owner-1", "prod-1");
      expect.unreachable("should have thrown");
    } catch (e: any) {
      expect(e.message).toContain("3 pesanan");
      expect(e.statusCode).toBe(400);
    }

    expect(mockProductDelete).not.toHaveBeenCalled();
  });

  test("does not delete when count query fails", async () => {
    mockOrderItemCount.mockImplementationOnce(() =>
      Promise.reject(new Error("DB error"))
    );

    try {
      await ProductModel.deleteProduct("owner-1", "prod-1");
      expect.unreachable("should have thrown");
    } catch {
      // expected
    }

    expect(mockProductDelete).not.toHaveBeenCalled();
  });

  test("deletes product referenced by zero order items", async () => {
    mockOrderItemCount.mockImplementationOnce(() => Promise.resolve(0));

    await ProductModel.deleteProduct("owner-1", "prod-2");

    expect(mockProductDelete).toHaveBeenCalledWith({
      where: { id: "prod-2", ownerId: "owner-1" },
    });
  });

  test("does not delete a product owned by another tenant", async () => {
    mockProductFindFirst.mockImplementationOnce(() => Promise.resolve(null));

    await expect(
      ProductModel.deleteProduct("owner-1", "foreign-product")
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockProductFindFirst).toHaveBeenCalledWith({
      where: { id: "foreign-product", ownerId: "owner-1" },
      include: { category: true },
    });
    expect(mockOrderItemCount).not.toHaveBeenCalled();
    expect(mockProductDelete).not.toHaveBeenCalled();
  });
});

describe("CategoryModel.deleteCategory", () => {
  afterEach(() => {
    mockProductCount.mockClear();
    mockCategoryDelete.mockClear();
    mockCategoryFindFirst.mockClear();
  });

  test("deletes category when no products reference it", async () => {
    await CategoryModel.deleteCategory("owner-1", "cat-1");

    expect(mockProductCount).toHaveBeenCalledWith({
      where: { ownerId: "owner-1", categoryId: "cat-1" },
    });
    expect(mockCategoryDelete).toHaveBeenCalledWith({
      where: { id: "cat-1", ownerId: "owner-1" },
    });
  });

  test("throws BadRequestError when products exist", async () => {
    mockProductCount.mockImplementationOnce(() => Promise.resolve(5));

    try {
      await CategoryModel.deleteCategory("owner-1", "cat-1");
      expect.unreachable("should have thrown");
    } catch (e: any) {
      expect(e.message).toContain("5 produk");
      expect(e.statusCode).toBe(400);
    }

    expect(mockCategoryDelete).not.toHaveBeenCalled();
  });

  test("deletes empty category", async () => {
    mockProductCount.mockImplementationOnce(() => Promise.resolve(0));

    await CategoryModel.deleteCategory("owner-1", "cat-2");

    expect(mockCategoryDelete).toHaveBeenCalledWith({
      where: { id: "cat-2", ownerId: "owner-1" },
    });
  });

  test("does not delete a category owned by another tenant", async () => {
    mockCategoryFindFirst.mockImplementationOnce(() => Promise.resolve(null));

    await expect(
      CategoryModel.deleteCategory("owner-1", "foreign-category")
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockProductCount).not.toHaveBeenCalled();
    expect(mockCategoryDelete).not.toHaveBeenCalled();
  });
});
