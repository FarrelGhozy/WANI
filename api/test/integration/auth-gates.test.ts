import { expect, test, describe, mock } from "bun:test"
import request from "supertest"
import jwt from "jsonwebtoken"

const mockLogFindMany = mock((_args: any) => Promise.resolve([]))
const mockLogCount = mock((_args: any) => Promise.resolve(0))

mock.module("@/config/db", () => ({
  prisma: {
    activityLog: {
      findMany: mockLogFindMany,
      count: mockLogCount,
    },
    usageCounter: {
      findUnique: mock((_args: any) => Promise.resolve(null)),
    },
  } as any,
}))

process.env.JWT_SECRET = "test-jwt-secret"

const { app } = await import("@/server")

function makeToken(): string {
  return jwt.sign({ id: "u1", email: "admin@test.com", role: "admin" }, "test-jwt-secret", { expiresIn: "1h" })
}

describe("auth gates on sensitive endpoints", () => {
  test.each([
    ["GET /api/customers/:id", "/api/customers/cus-1"],
    ["GET /api/conversations/:id", "/api/conversations/conv-1"],
    ["GET /api/dashboard/stats", "/api/dashboard/stats"],
    ["GET /api/logs", "/api/logs?page=1&limit=10"],
    ["GET /api/usage", "/api/usage"],
  ])("rejects unauthenticated %s", async (_label, url) => {
    const res = await request(app).get(url)
    expect(res.status).toBe(401)
  })

  test("allows authenticated request to GET /api/logs", async () => {
    mockLogFindMany.mockReset()
    mockLogCount.mockReset()
    mockLogFindMany.mockResolvedValueOnce([])
    mockLogCount.mockResolvedValueOnce(0)

    const res = await request(app)
      .get("/api/logs?page=1&limit=10")
      .set("Authorization", `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
  })

  test("allows authenticated request to GET /api/usage", async () => {
    const res = await request(app)
      .get("/api/usage")
      .set("Authorization", `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ llmCalls: 0, tokensIn: 0, tokensOut: 0 })
  })
})
