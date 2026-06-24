import { expect, test, describe, beforeEach, afterEach } from "bun:test"
import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { requireAuth } from "@/src/middleware/auth"
import { validate } from "@/src/middleware/validate"
import { errorHandler } from "@/src/middleware/error"
import { BadRequestError, UnauthorizedError, NotFoundError, AppError } from "@/src/utils/errors"
import { z } from "zod"

const ORIGINAL_API_TOKEN = process.env.API_TOKEN

beforeEach(() => {
  process.env.API_TOKEN = "test-api-token"
})

afterEach(() => {
  process.env.API_TOKEN = ORIGINAL_API_TOKEN
})

// ── requireAuth ──────────────────────────────────────────────

describe("requireAuth", () => {
  test("passes with valid Bearer token", () => {
    const req = { headers: { authorization: "Bearer test-api-token" } } as Request
    let called = false
    const next: NextFunction = () => { called = true }
    requireAuth(req, {} as Response, next)
    expect(called).toBe(true)
  })

  test("throws on missing header", () => {
    const req = { headers: {} } as Request
    expect(() => requireAuth(req, {} as Response, () => {})).toThrow(UnauthorizedError)
  })

  test("throws on wrong scheme", () => {
    const req = { headers: { authorization: "Basic xxx" } } as Request
    expect(() => requireAuth(req, {} as Response, () => {})).toThrow(UnauthorizedError)
  })

  test("throws on wrong token", () => {
    const req = { headers: { authorization: "Bearer wrong-token" } } as Request
    expect(() => requireAuth(req, {} as Response, () => {})).toThrow(UnauthorizedError)
  })
})

// ── requireJwt ───────────────────────────────────────────────
// Uses dynamic import because JWT_SECRET is captured at module load time.

const JWT_TEST_SECRET = "wani-dev-secret-change-in-production"

describe("requireJwt", () => {
  test("passes with valid JWT", async () => {
    process.env.JWT_SECRET = JWT_TEST_SECRET
    const { requireJwt } = await import("@/src/middleware/jwt")
    const token = jwt.sign({ id: "u1", email: "a@b.com", role: "admin" }, JWT_TEST_SECRET)
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    let called = false
    requireJwt(req, {} as Response, () => { called = true })
    expect(called).toBe(true)
    expect((req as any).user).toBeDefined()
    expect((req as any).user.id).toBe("u1")
  })

  test("throws on missing header", async () => {
    process.env.JWT_SECRET = JWT_TEST_SECRET
    const { requireJwt } = await import("@/src/middleware/jwt")
    const req = { headers: {} } as Request
    expect(() => requireJwt(req, {} as Response, () => {})).toThrow(UnauthorizedError)
  })

  test("throws on expired token", async () => {
    process.env.JWT_SECRET = JWT_TEST_SECRET
    const { requireJwt } = await import("@/src/middleware/jwt")
    const token = jwt.sign({ id: "u1" }, JWT_TEST_SECRET, { expiresIn: "0s" })
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    expect(() => requireJwt(req, {} as Response, () => {})).toThrow("invalid or expired token")
  })

  test("throws on wrong secret", async () => {
    process.env.JWT_SECRET = JWT_TEST_SECRET
    const { requireJwt } = await import("@/src/middleware/jwt")
    const token = jwt.sign({ id: "u1" }, "wrong-secret")
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    expect(() => requireJwt(req, {} as Response, () => {})).toThrow("invalid or expired token")
  })
})

// ── validate ─────────────────────────────────────────────────

describe("validate middleware", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
  })

  test("passes on valid body", async () => {
    const req = { body: { name: "Budi", age: 25 } } as Request
    let nextCalled = false
    await validate({ body: schema })(req, {} as Response, () => { nextCalled = true })
    expect(nextCalled).toBe(true)
    expect(req.body.name).toBe("Budi")
  })

  test("throws on invalid body", async () => {
    const req = { body: { name: "", age: -1 } } as Request
    try {
      await validate({ body: schema })(req, {} as Response, () => {})
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestError)
      expect((e as BadRequestError).message).toBe("validation failed")
      expect((e as BadRequestError).details).toBeDefined()
    }
  })

  test("coerces and passes on valid query", async () => {
    const querySchema = z.object({ page: z.coerce.number().int().min(1) })
    const req = { query: { page: "2" } } as unknown as Request
    let nextCalled = false
    await validate({ query: querySchema })(req, {} as Response, () => { nextCalled = true })
    expect(nextCalled).toBe(true)
    expect((req.query as any).page).toBe(2)
  })

  test("skips validation when no schema provided", async () => {
    const req = { body: { anything: true } } as Request
    let nextCalled = false
    await validate({})(req, {} as Response, () => { nextCalled = true })
    expect(nextCalled).toBe(true)
  })
})

// ── errorHandler ─────────────────────────────────────────────

describe("errorHandler", () => {
  function mockRes() {
    let statusCode = 200
    let body: unknown
    return {
      status: (code: number) => {
        statusCode = code
        return { json: (data: unknown) => { body = data } }
      },
      getStatus: () => statusCode,
      getBody: () => body,
    }
  }

  test("handles AppError with correct status", () => {
    const res = mockRes() as any
    const err = new BadRequestError("invalid input", { field: "email" })
    errorHandler(err, {} as Request, res, () => {})
    expect(res.getStatus()).toBe(400)
    const b = res.getBody() as any
    expect(b.status).toBe("failure")
    expect(b.message).toBe("invalid input")
    expect(b.data).toEqual({ field: "email" })
  })

  test("handles NotFoundError", () => {
    const res = mockRes() as any
    errorHandler(new NotFoundError("user not found"), {} as Request, res, () => {})
    expect(res.getStatus()).toBe(404)
  })

  test("handles non-AppError as 500 in production", () => {
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "production"
    const res = mockRes() as any
    errorHandler(new Error("unexpected"), {} as Request, res, () => {})
    expect(res.getStatus()).toBe(500)
    const b = res.getBody() as any
    expect(b.message).toBe("internal server error")
    process.env.NODE_ENV = origEnv
  })

  test("includes stack in dev mode for non-AppError", () => {
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "development"
    const res = mockRes() as any
    const err = new Error("dev error")
    errorHandler(err, {} as Request, res, () => {})
    expect(res.getStatus()).toBe(500)
    const b = res.getBody() as any
    expect(b.data).toBeDefined()
    expect(b.data!.stack).toBeDefined()
    process.env.NODE_ENV = origEnv
  })
})
