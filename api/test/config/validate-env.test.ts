import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { validateProductionEnv } from "@/config/validate-env"

const KEYS = [
  "NODE_ENV",
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "DATABASE_NAME",
  "JWT_SECRET",
  "WAHA_API_KEY",
] as const

let saved: Record<string, string | undefined> = {}

function setValidEnv(): void {
  process.env.NODE_ENV = "production"
  process.env.DATABASE_HOST = "db"
  process.env.DATABASE_PORT = "5432"
  process.env.DATABASE_USER = "postgres"
  process.env.DATABASE_PASSWORD = "a-strong-database-password"
  process.env.DATABASE_NAME = "wani_api"
  process.env.JWT_SECRET = "a".repeat(64)
  process.env.WAHA_API_KEY = "2f4c9c0e-7a6b-4f1a-9f7e-1d2c3b4a5e6f"
}

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))
})

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
})

describe("validateProductionEnv", () => {
  test("is a no-op in development", () => {
    process.env.NODE_ENV = "development"
    delete process.env.JWT_SECRET
    expect(() => validateProductionEnv()).not.toThrow()
  })

  test("lists missing required variables", () => {
    setValidEnv()
    delete process.env.DATABASE_NAME
    delete process.env.JWT_SECRET

    expect(() => validateProductionEnv()).toThrow(
      "Missing required production environment variables: DATABASE_NAME, JWT_SECRET",
    )
  })

  test("rejects the example JWT secret", () => {
    setValidEnv()
    process.env.JWT_SECRET = "change-me-to-a-random-jwt-secret"

    expect(() => validateProductionEnv()).toThrow("JWT_SECRET must be a random value")
  })

  test("rejects a short JWT secret", () => {
    setValidEnv()
    process.env.JWT_SECRET = "too-short"

    expect(() => validateProductionEnv()).toThrow("at least 32 characters")
  })

  test("rejects placeholder database and WAHA credentials", () => {
    setValidEnv()
    process.env.DATABASE_PASSWORD = "change-me"

    expect(() => validateProductionEnv()).toThrow("DATABASE_PASSWORD still uses")
  })

  test("accepts a complete production env", () => {
    setValidEnv()
    expect(() => validateProductionEnv()).not.toThrow()
  })
})
