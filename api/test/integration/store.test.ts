import { expect, test, describe, beforeEach, mock, afterEach } from "bun:test"

const mockStoreFindUnique = mock((_args: any) => Promise.resolve(null))
const mockStoreUpsert = mock((_args: any) => Promise.resolve({}))
const mockPmFindMany = mock((_args: any) => Promise.resolve([]))
const mockPmFindUnique = mock((_args: any) => Promise.resolve(null))
const mockPmCreate = mock((_args: any) => Promise.resolve({}))
const mockPmUpdate = mock((_args: any) => Promise.resolve({}))
const mockPmDelete = mock((_args: any) => Promise.resolve({}))
const mockPmCount = mock((_args: any) => Promise.resolve(0))

mock.module("@/src/config/db", () => ({
  prisma: {
    store: {
      findUnique: mockStoreFindUnique,
      upsert: mockStoreUpsert,
      update: mock((_args: any) => Promise.resolve({})),
    },
    storePaymentMethod: {
      findMany: mockPmFindMany,
      findUnique: mockPmFindUnique,
      create: mockPmCreate,
      update: mockPmUpdate,
      delete: mockPmDelete,
      count: mockPmCount,
    },
    $transaction: mock((fn: any) => fn({})),
  } as any,
}))

process.env.JWT_SECRET = "test-jwt-secret"

import { getStore, upsertStore } from "@/src/controllers/store"
import {
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/src/controllers/store-payment"
import type { Request } from "express"

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
  } as Request
}

function mockRes() {
  let statusCode = 200
  let body: unknown
  return {
    status: (code: number) => {
      statusCode = code
      return { json: (data: unknown) => { body = data } }
    },
    getStatus: () => statusCode,
    getBody: () => body as any,
  }
}

describe("GET /api/store", () => {
  beforeEach(() => {
    mockStoreFindUnique.mockReset()
    mockPmFindMany.mockReset()
    mockPmCount.mockReset()
  })

  test("returns store data with hasPaymentMethods true", async () => {
    mockStoreFindUnique.mockResolvedValueOnce({
      id: "default", businessName: "Toko WANI", phone: "08123456789",
      logoUrl: null, address: "Jl. Merdeka", businessHours: null,
      paymentMethods: null, shippingInfo: null, returnPolicy: null, isActive: true,
    })
    mockPmCount.mockResolvedValueOnce(3)

    const req = mockReq({ user: { id: "u1", email: "admin@test.com", role: "admin" } })
    const res = mockRes()

    await getStore(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    const body = res.getBody()
    expect(body.data.businessName).toBe("Toko WANI")
    expect(body.data.hasPaymentMethods).toBe(true)
  })

  test("returns store data with hasPaymentMethods false", async () => {
    mockStoreFindUnique.mockResolvedValueOnce({
      id: "default", businessName: "Toko Baru", phone: "08123456789",
      logoUrl: null, address: null, businessHours: null,
      paymentMethods: null, shippingInfo: null, returnPolicy: null, isActive: true,
    })
    mockPmCount.mockResolvedValueOnce(0)

    const req = mockReq({ user: { id: "u1", email: "admin@test.com", role: "admin" } })
    const res = mockRes()

    await getStore(req as any, res as any)

    expect(res.getBody().data.hasPaymentMethods).toBe(false)
  })
})

describe("PUT /api/store", () => {
  test("updates store profile (JWT user required)", async () => {
    mockStoreUpsert.mockReset()
    mockStoreUpsert.mockResolvedValueOnce({
      id: "default", businessName: "WANI Super", phone: "08123456789",
      logoUrl: null, address: "Jl. Baru", businessHours: null,
      paymentMethods: null, shippingInfo: null, returnPolicy: null, isActive: true,
    })

    const req = mockReq({
      body: { businessName: "WANI Super", address: "Jl. Baru" },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    await upsertStore(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    expect(res.getBody().data.businessName).toBe("WANI Super")
  })
})

describe("GET /api/store/payment-methods", () => {
  beforeEach(() => {
    mockPmFindMany.mockReset()
  })

  test("lists payment methods", async () => {
    mockPmFindMany.mockResolvedValueOnce([
      { id: "pm1", type: "QRIS", label: "QRIS", isActive: true, sortOrder: 0 },
      { id: "pm2", type: "BANK_TRANSFER", label: "BCA", isActive: true, sortOrder: 1 },
    ])

    const req = mockReq()
    const res = mockRes()

    await listPaymentMethods(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    expect(res.getBody().data).toHaveLength(2)
  })
})

describe("POST /api/store/payment-methods", () => {
  test("creates a payment method", async () => {
    mockPmCreate.mockReset()
    mockPmCreate.mockResolvedValueOnce({
      id: "pm1", type: "QRIS", label: "QRIS Toko", isActive: true, sortOrder: 0,
    })

    const req = mockReq({
      body: { type: "QRIS", label: "QRIS Toko" },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    await createPaymentMethod(req as any, res as any)

    expect(res.getStatus()).toBe(201)
    expect(res.getBody().data.type).toBe("QRIS")
  })
})

describe("PUT /api/store/payment-methods/:id", () => {
  test("updates a payment method", async () => {
    mockPmFindUnique.mockReset()
    mockPmUpdate.mockReset()
    mockPmFindUnique.mockResolvedValueOnce({ id: "pm1" })
    mockPmUpdate.mockResolvedValueOnce({
      id: "pm1", type: "QRIS", label: "QRIS Updated", isActive: false, sortOrder: 1,
    })

    const req = mockReq({
      params: { id: "pm1" },
      body: { label: "QRIS Updated", isActive: false },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    await updatePaymentMethod(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    expect(res.getBody().data.label).toBe("QRIS Updated")
  })

  test("returns 404 for non-existent payment method", async () => {
    mockPmFindUnique.mockReset()
    mockPmFindUnique.mockResolvedValueOnce(null)

    const req = mockReq({
      params: { id: "nonexistent" },
      body: { label: "X" },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    try {
      await updatePaymentMethod(req as any, res as any)
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.statusCode).toBe(404)
    }
  })
})

describe("DELETE /api/store/payment-methods/:id", () => {
  test("deletes a payment method", async () => {
    mockPmFindUnique.mockReset()
    mockPmDelete.mockReset()
    mockPmFindUnique.mockResolvedValueOnce({ id: "pm1" })
    mockPmDelete.mockResolvedValueOnce({})

    const req = mockReq({
      params: { id: "pm1" },
      user: { id: "u1", email: "admin@test.com", role: "admin" },
    })
    const res = mockRes()

    await deletePaymentMethod(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    expect(res.getBody().status).toBe("success")
  })
})
