import { expect, test, describe, beforeEach, mock, afterEach } from "bun:test"

const mockUserFindUnique = mock((_args: any) => Promise.resolve(null))
const mockUserFindFirst = mock((_args: any) => Promise.resolve(null))
const mockUserCreate = mock((_args: any) => Promise.resolve({ id: "u1", name: "Budi", email: "test@test.com", role: "admin" }))
const mockUserUpdate = mock((_args: any) => Promise.resolve({}))
const mockStoreUpsert = mock((_args: any) => Promise.resolve({}))

const mockSendEmail = mock((_to: string, _subject: string, _html: string) => Promise.resolve())

mock.module("@/src/services/email", () => ({
  sendEmail: mockSendEmail,
  isEmailConfigured: () => true,
}))

mock.module("@/src/config/db", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      findFirst: mockUserFindFirst,
      create: mockUserCreate,
      update: mockUserUpdate,
    },
    store: {
      upsert: mockStoreUpsert,
    },
    $transaction: mock((fn: any) => fn({ user: {} })),
  } as any,
}))

// Set JWT secret before importing auth controller
process.env.JWT_SECRET = "test-jwt-secret"

import { register, login, me, logout } from "@/src/controllers/auth"
import * as emailService from "@/src/services/email"
import type { Request, Response } from "express"

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

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mockUserFindUnique.mockReset()
    mockUserCreate.mockReset()
    mockStoreUpsert.mockReset()
  })

  test("registers a new user successfully", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null)
    mockUserCreate.mockResolvedValueOnce({
      id: "u1", name: "Budi", email: "budi@test.com", role: "admin",
    })

    const req = mockReq({
      body: { name: "Budi", email: "budi@test.com", password: "rahasia123" },
    })
    const res = mockRes()

    await register(req as any, res as any)

    expect(res.getStatus()).toBe(201)
    const body = res.getBody()
    expect(body.status).toBe("success")
    expect(body.data.token).toBeTruthy()
    expect(body.data.user.email).toBe("budi@test.com")
    expect(mockStoreUpsert).toHaveBeenCalled()
  })

  test("rejects duplicate email", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      id: "existing", name: "Old", email: "budi@test.com", password: "hash", role: "admin",
    })

    const req = mockReq({
      body: { name: "Budi", email: "budi@test.com", password: "rahasia123" },
    })
    const res = mockRes()

    try {
      await register(req as any, res as any)
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.statusCode).toBe(400)
      expect(e.message).toBe("email already registered")
    }
  })
})

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    mockUserFindUnique.mockReset()
  })

  test("logs in with valid credentials", async () => {
    const hashed = await Bun.password.hash("rahasia123", { algorithm: "bcrypt", cost: 5 })
    mockUserFindUnique.mockResolvedValueOnce({
      id: "u1", name: "Budi", email: "budi@test.com", password: hashed, role: "admin",
    })

    const req = mockReq({
      body: { email: "budi@test.com", password: "rahasia123" },
    })
    const res = mockRes()

    await login(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    const body = res.getBody()
    expect(body.status).toBe("success")
    expect(body.data.token).toBeTruthy()
    expect(body.data.user.email).toBe("budi@test.com")
    expect(body.data.user.password).toBeUndefined()
  })

  test("rejects wrong password", async () => {
    const hashed = await Bun.password.hash("correct", { algorithm: "bcrypt", cost: 5 })
    mockUserFindUnique.mockResolvedValueOnce({
      id: "u1", name: "Budi", email: "budi@test.com", password: hashed, role: "admin",
    })

    const req = mockReq({
      body: { email: "budi@test.com", password: "wrongpassword" },
    })
    const res = mockRes()

    try {
      await login(req as any, res as any)
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.statusCode).toBe(401)
    }
  })

  test("rejects non-existent email", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null)

    const req = mockReq({
      body: { email: "unknown@test.com", password: "anything" },
    })
    const res = mockRes()

    try {
      await login(req as any, res as any)
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.statusCode).toBe(401)
      expect(e.message).toBe("invalid email or password")
    }
  })
})

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    mockUserFindUnique.mockReset()
  })

  test("returns user for valid JWT user", async () => {
    mockUserFindUnique.mockImplementation((args: any) => {
      if (args?.where?.id === "u1") {
        return Promise.resolve({ id: "u1", name: "Budi", email: "budi@test.com", role: "admin" })
      }
      return Promise.resolve(null)
    })

    const req = mockReq({ user: { id: "u1", email: "budi@test.com", role: "admin" } })
    const res = mockRes()

    await me(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    const body = res.getBody()
    expect(body.data.email).toBe("budi@test.com")
  })

  test("returns 401 when user not found in DB", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null)

    const req = mockReq({ user: { id: "gone", email: "gone@test.com", role: "admin" } })
    const res = mockRes()

    try {
      await me(req as any, res as any)
      expect.unreachable("should have thrown")
    } catch (e: any) {
      expect(e.statusCode).toBe(401)
      expect(e.message).toBe("user not found")
    }
  })
})

describe("POST /api/auth/logout", () => {
  test("returns success (stateless JWT)", async () => {
    const req = mockReq()
    const res = mockRes()

    await logout(req as any, res as any)

    expect(res.getStatus()).toBe(200)
    expect(res.getBody().status).toBe("success")
  })
})
