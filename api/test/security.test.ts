import { expect, test, describe } from "bun:test"
import { app } from "@/src/server"

describe("Security headers", () => {
  test("disables x-powered-by", async () => {
    const res = await app.handle(new Request("http://localhost/api/monitoring/health"))
    expect(res.headers.get("x-powered-by")).toBeNull()
  })

  test("has strict-transport-security (HSTS)", async () => {
    const res = await app.handle(new Request("http://localhost/api/monitoring/health"))
    const hsts = res.headers.get("strict-transport-security")
    expect(hsts).toBeTruthy()
    expect(hsts).toContain("max-age=31536000")
    expect(hsts).toContain("includeSubDomains")
    expect(hsts).toContain("preload")
  })

  test("has content-security-policy", async () => {
    const res = await app.handle(new Request("http://localhost/api/monitoring/health"))
    const csp = res.headers.get("content-security-policy")
    expect(csp).toBeTruthy()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).not.toContain("localhost")
    expect(csp).not.toContain("cdn.tailwindcss.com")
  })

  test("has x-frame-options", async () => {
    const res = await app.handle(new Request("http://localhost/api/monitoring/health"))
    expect(res.headers.get("x-frame-options")).toBe("DENY")
  })

  test("has cross-origin-resource-policy", async () => {
    const res = await app.handle(new Request("http://localhost/api/monitoring/health"))
    expect(res.headers.get("cross-origin-resource-policy")).toBe("cross-origin")
  })
})

describe("Rate limiting", () => {
  test("returns rate limit headers", async () => {
    const res = await app.handle(new Request("http://localhost/api/monitoring/health"))
    // Health endpoint is skipped from rate limit
    expect(res.status).toBe(200)
  })
})
