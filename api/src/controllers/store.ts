import type { Request, Response } from "express"
import type { z } from "zod"
import { StoreModel } from "@/src/models/store"
import { StorePaymentMethodModel } from "@/src/models/store-payment"
import { sendResponse } from "@/src/utils/response"
import { upsertStoreSchema } from "@/src/schemas/store"

type UpsertStoreBody = z.infer<typeof upsertStoreSchema>

export async function getStore(_req: Request, res: Response): Promise<void> {
  const store = await StoreModel.find()
  const hasPaymentMethods = await StorePaymentMethodModel.hasAny()
  sendResponse(res, 200, "store retrieved", {
    ...store,
    hasPaymentMethods,
  })
}

export async function upsertStore(
  req: Request<Record<string, string>, any, UpsertStoreBody>,
  res: Response,
): Promise<void> {
  const store = await StoreModel.upsert(req.body)
  sendResponse(res, 200, "store updated", store)
}
