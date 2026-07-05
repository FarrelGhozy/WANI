import type { Request } from "express"
import { prisma } from "@/src/config/db"
import { UnauthorizedError } from "@/src/utils/errors"

let _firstOwnerId: string | null = null
let _pending: Promise<string> | null = null

async function getFirstOwnerId(): Promise<string> {
  if (_firstOwnerId) return _firstOwnerId
  if (_pending) return _pending
  _pending = (async () => {
    try {
      const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } })
      if (user?.id) {
        _firstOwnerId = user.id
        return _firstOwnerId
      }
    } catch {
      // Prisma unavailable (test env), fall through to "default"
    }
    _firstOwnerId = "default"
    return _firstOwnerId
  })()
  return _pending
}

export function getOwnerId(req: Request): string {
  if (!req.user?.id) {
    throw new UnauthorizedError("authentication required")
  }
  return req.user.id
}

export async function getOwnerIdOrFirst(req: Request): Promise<string> {
  if (req.user?.id) return req.user.id
  return getFirstOwnerId()
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
