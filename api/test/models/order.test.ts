import { expect, test, describe, beforeEach, mock } from "bun:test"

const mockOrderFindUnique = mock((_args: any) => Promise.resolve(null))
const mockOrderUpdate = mock((_args: any) => Promise.resolve({}))
const mockOrderCreate = mock((_args: any) => Promise.resolve({}))
const mockOrderFindUniqueOrThrow = mock((_args: any) => Promise.resolve({}))
const mockOrderItemFindMany = mock((_args: any) => Promise.resolve([]))
const mockOrderItemCreateMany = mock((_args: any) => Promise.resolve({ count: 1 }))
const mockProductFindMany = mock((_args: any) => Promise.resolve([]))
const mockProductUpdate = mock((_args: any) => Promise.resolve({}))

const mockTransaction = mock((fn: any) => fn({
  order: {
    findUnique: mockOrderFindUnique,
    update: mockOrderUpdate,
    create: mockOrderCreate,
    findUniqueOrThrow: mockOrderFindUniqueOrThrow,
  },
  orderItem: {
    createMany: mockOrderItemCreateMany,
    findMany: mockOrderItemFindMany,
  },
  product: {
    findMany: mockProductFindMany,
    update: mockProductUpdate,
  },
}))

mock.module("@/src/config/db", () => ({
  prisma: {
    order: {
      findUnique: mockOrderFindUnique,
      findUniqueOrThrow: mockOrderFindUniqueOrThrow,
      update: mockOrderUpdate,
      create: mockOrderCreate,
      findMany: mock((_args: any) => Promise.resolve([])),
      count: mock((_args: any) => Promise.resolve(0)),
    },
    orderItem: {
      findMany: mock((_args: any) => Promise.resolve([])),
      createMany: mockOrderItemCreateMany,
    },
    product: {
      findMany: mockProductFindMany,
      update: mockProductUpdate,
    },
    payment: {
      create: mock((_args: any) => Promise.resolve({})),
      update: mock((_args: any) => Promise.resolve({})),
    },
    $transaction: mockTransaction,
  } as any,
}))

import { OrderModel } from "@/src/models/order"

const baseOrder = {
  id: "order-1", status: "PENDING", stockReleased: false,
  customerId: "c1", customer: { name: "Budi" },
  totalAmount: 50000, notes: null, source: "whatsapp",
  items: [{ id: "oi1", productId: "p1", qty: 2, unitPrice: 25000, subtotal: 50000, product: { name: "Test", stock: 10 } }],
  payment: null,
  createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01"),
}

describe("OrderModel.updateStatus", () => {
  beforeEach(() => {
    mockOrderFindUnique.mockReset()
    mockOrderUpdate.mockReset()
    mockOrderFindUniqueOrThrow.mockReset()
    mockOrderItemFindMany.mockReset()
    mockProductFindMany.mockReset()
    mockProductUpdate.mockReset()
  })

  test("throws NotFoundError for missing order", async () => {
    mockOrderFindUnique.mockResolvedValueOnce(null)

    try {
      await OrderModel.updateStatus("nonexistent", "CONFIRMED")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.statusCode).toBe(404)
    }
  })

  test("throws BadRequestError on invalid transition", async () => {
    mockOrderFindUnique.mockResolvedValueOnce(baseOrder)

    try {
      await OrderModel.updateStatus("order-1", "PROCESSING")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("invalid status transition")
      expect(e.statusCode).toBe(400)
    }
  })

  test("throws on transition from CANCELLED (terminal)", async () => {
    mockOrderFindUnique.mockResolvedValueOnce({ ...baseOrder, status: "CANCELLED", stockReleased: false })

    try {
      await OrderModel.updateStatus("order-1", "CONFIRMED")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("invalid status transition")
    }
  })

  test("throws on transition from COMPLETED (terminal)", async () => {
    mockOrderFindUnique.mockResolvedValueOnce({ ...baseOrder, status: "COMPLETED", stockReleased: true })

    try {
      await OrderModel.updateStatus("order-1", "CANCELLED")
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("invalid status transition")
    }
  })

  test("valid transition: CONFIRMED → PROCESSING", async () => {
    mockOrderFindUnique.mockResolvedValueOnce({ ...baseOrder, status: "CONFIRMED", stockReleased: true })
    mockOrderFindUniqueOrThrow.mockResolvedValueOnce({ ...baseOrder, status: "PROCESSING", stockReleased: true })

    const result = await OrderModel.updateStatus("order-1", "PROCESSING")

    expect(result.status).toBe("PROCESSING")
  })

  test("valid transition: PROCESSING → COMPLETED", async () => {
    mockOrderFindUnique.mockResolvedValueOnce({ ...baseOrder, status: "PROCESSING", stockReleased: true })
    mockOrderFindUniqueOrThrow.mockResolvedValueOnce({ ...baseOrder, status: "COMPLETED", stockReleased: true })

    const result = await OrderModel.updateStatus("order-1", "COMPLETED")

    expect(result.status).toBe("COMPLETED")
  })
})

describe("OrderModel.createFromItems", () => {
  beforeEach(() => {
    mockOrderCreate.mockReset()
    mockOrderItemCreateMany.mockReset()
    mockProductFindMany.mockReset()
  })

  test("creates order with items in transaction", async () => {
    mockProductFindMany.mockResolvedValueOnce([
      { id: "p1", name: "Nasi Goreng" },
      { id: "p2", name: "Es Teh" },
    ])
    mockOrderCreate.mockResolvedValueOnce({ id: "order-new" })
    mockOrderItemCreateMany.mockResolvedValueOnce({ count: 2 })

    const result = await OrderModel.createFromItems("c1", [
      { name: "Nasi Goreng", qty: 2 },
      { name: "Es Teh", qty: 1 },
    ])

    expect(result.order.id).toBe("order-new")
    expect(mockOrderCreate).toHaveBeenCalled()
    expect(mockOrderItemCreateMany).toHaveBeenCalled()
  })
})
