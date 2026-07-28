import type { Request, Response } from "express"
import type { z } from "zod"
import { StoreModel } from "@/models/store"
import { StorePaymentMethodModel } from "@/models/store-payment"
import { sendResponse } from "@/utils/response"
import { getOwnerId, getOwnerIdOrFirst } from "@/middleware/owner"
import { upsertStoreSchema } from "@/schemas/store"

type UpsertStoreBody = z.infer<typeof upsertStoreSchema>

export async function getStore(req: Request, res: Response): Promise<void> {
  const ownerId = await getOwnerIdOrFirst(req)
  const store = await StoreModel.findByOwner(ownerId)
  const hasPaymentMethods = await StorePaymentMethodModel.hasAny(ownerId)
  sendResponse(res, 200, "store retrieved", {
    ...store,
    hasPaymentMethods,
  })
}

export async function upsertStore(
  req: Request<Record<string, string>, any, UpsertStoreBody>,
  res: Response,
): Promise<void> {
  const ownerId = getOwnerId(req)
  const store = await StoreModel.upsertByOwner(ownerId, req.body)
  sendResponse(res, 200, "store updated", store)
}
