import { getNodeEnv } from "@/config/env"

const PRODUCTION_REQUIRED = [
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "DATABASE_NAME",
  "JWT_SECRET",
] as const

const PLACEHOLDERS = new Set([
  "change-me",
  "change-me-to-a-random-jwt-secret",
  "change-me-to-a-random-uuid-without-dashes",
])

/**
 * Fail fast in production instead of booting with an unusable or insecure env.
 * Development keeps its convenience defaults (random per-process JWT secret).
 */

export function validateProductionEnv(): void {
  if (getNodeEnv() !== "production") return

  const missing = PRODUCTION_REQUIRED.filter((key) => !process.env[key]?.trim())
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    )
  }

  const jwtSecret = process.env.JWT_SECRET!.trim()
  if (PLACEHOLDERS.has(jwtSecret) || jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET must be a random value of at least 32 characters in production. " +
        "Generate one with: openssl rand -hex 32",
    )
  }

  for (const key of ["DATABASE_PASSWORD", "WAHA_API_KEY"] as const) {
    if (process.env[key] && PLACEHOLDERS.has(process.env[key]!.trim())) {
      throw new Error(`${key} still uses the example placeholder value`)
    }
  }
}
