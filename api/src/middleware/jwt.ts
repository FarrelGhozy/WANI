import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { UnauthorizedError } from "@/src/utils/errors"

const JWT_SECRET = process.env.JWT_SECRET ?? "wani-dev-secret-change-in-production"

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
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    throw new UnauthorizedError("invalid or expired token")
  }
}
