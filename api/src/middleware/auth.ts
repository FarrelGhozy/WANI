import type { Request, Response, NextFunction } from "express"
import { UnauthorizedError } from "@/src/utils/errors"

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined
  if (!token || token !== process.env.API_TOKEN) {
    throw new UnauthorizedError()
  }
  next()
}
