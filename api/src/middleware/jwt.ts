import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { randomBytes } from "node:crypto"
import { UnauthorizedError } from "@/src/utils/errors"

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET environment variable is required in production. " +
      "Generate: openssl rand -hex 32"
    )
  }
  // Development: auto-generate random secret per process start
  return randomBytes(32).toString("hex")
}

export interface JwtPayload {
  id: string
  email: string
  role: string
}

export function requireJwt(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError()
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload
    req.user = payload
    next()
  } catch {
    throw new UnauthorizedError("invalid or expired token")
  }
}
