import type { Request, Response } from "express"
import { StoreModel } from "@/src/models/store"
import { sendResponse } from "@/src/utils/response"

export async function getStore(_req: Request, res: Response): Promise<void> {
  const store = await StoreModel.find()
  sendResponse(res, 200, "store retrieved", store)
}

export async function upsertStore(req: Request, res: Response): Promise<void> {
  const store = await StoreModel.upsert(req.body)
  sendResponse(res, 200, "store updated", store)
}
