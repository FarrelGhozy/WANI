import { expect, test, describe, beforeAll } from "bun:test"
import request from "supertest"

beforeAll(() => {
  process.env.LLM_API_KEY ??= "test-key"
  process.env.JWT_SECRET ??= "test-secret"
})

import { app } from "@/src/server"

describe("Security headers", () => {
  test("disables x-powered-by", async () => {
    const res = await request(app).get("/api/health")
    expect(res.headers["x-powered-by"]).toBeUndefined()
  })

  test("has strict-transport-security (HSTS)", async () => {
    const res = await request(app).get("/api/health")
    const hsts = res.headers["strict-transport-security"]
    expect(hsts).toBeTruthy()
    expect(hsts).toContain("max-age=31536000")
    expect(hsts).toContain("includeSubDomains")
    expect(hsts).toContain("preload")
  })

  test("has content-security-policy", async () => {
    const res = await request(app).get("/api/health")
    const csp = res.headers["content-security-policy"]
    expect(csp).toBeTruthy()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).not.toContain("localhost")
    expect(csp).not.toContain("cdn.tailwindcss.com")
  })

  test("has x-frame-options", async () => {
    const res = await request(app).get("/api/health")
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN")
  })

  test("has cross-origin-resource-policy", async () => {
    const res = await request(app).get("/api/health")
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin")
  })
})

describe("Rate limiting", () => {
  test("returns rate limit headers on regular endpoints", async () => {
    const res = await request(app).get("/api/store")
    expect(res.headers["ratelimit-limit"]).toBeTruthy()
    expect(res.headers["ratelimit-remaining"]).toBeTruthy()
  })

  test("returns 401 on protected store PUT endpoint without auth", async () => {
    const res = await request(app).put("/api/store").send({ businessName: "test" })
    expect(res.status).toBe(401)
  })
})
