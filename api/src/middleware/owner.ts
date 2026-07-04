import type { Request } from "express"
import { UnauthorizedError } from "@/src/utils/errors"

export function getOwnerId(req: Request): string {
  if (!req.user?.id) {
    throw new UnauthorizedError("authentication required")
  }
  return req.user.id
}

export function ownerFilter(ownerId: string): { ownerId: string } {
  return { ownerId }
}

export function ownerWhere<T extends Record<string, unknown>>(
  where: T,
  ownerId: string,
): T & { ownerId: string } {
  return { ...where, ownerId }
}
