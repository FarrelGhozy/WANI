import type { Request, Response } from "express"
import type { z } from "zod"
import { StorePaymentMethodModel } from "@/src/models/store-payment"
import { sendResponse } from "@/src/utils/response"
import { NotFoundError } from "@/src/utils/errors"
import { getOwnerId, getOwnerIdOrFirst } from "@/src/middleware/owner"
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from "@/src/schemas/store-payment"

type CreateBody = z.infer<typeof createPaymentMethodSchema>
type UpdateBody = z.infer<typeof updatePaymentMethodSchema>

export async function listPaymentMethods(
  req: Request,
  res: Response,
): Promise<void> {
  const ownerId = await getOwnerIdOrFirst(req)
  const methods = await StorePaymentMethodModel.listByOwner(ownerId)
  sendResponse(res, 200, "payment methods retrieved", methods)
}

export async function createPaymentMethod(
  req: Request<Record<string, string>, unknown, CreateBody>,
  res: Response,
): Promise<void> {
  const ownerId = getOwnerId(req)
  const data: Record<string, unknown> = {
    type: req.body.type,
    label: req.body.label,
    ownerId,
    isActive: true,
    sortOrder: 0,
  }
  if ("accountName" in req.body) data.accountName = req.body.accountName ?? null
  if ("accountNumber" in req.body) data.accountNumber = req.body.accountNumber ?? null
  if ("bankName" in req.body) data.bankName = req.body.bankName ?? null
  if ("providerName" in req.body) data.providerName = req.body.providerName ?? null
  if ("phoneNumber" in req.body) data.phoneNumber = req.body.phoneNumber ?? null
  if ("qrImageUrl" in req.body) data.qrImageUrl = req.body.qrImageUrl ?? null
  if ("instructions" in req.body) data.instructions = req.body.instructions ?? null

  const method = await StorePaymentMethodModel.create(data)
  sendResponse(res, 201, "payment method created", method)
}

export async function updatePaymentMethod(
  req: Request<{ id: string }, any, UpdateBody>,
  res: Response,
): Promise<void> {
  getOwnerId(req)
  const existing = await StorePaymentMethodModel.getById(req.params.id)
  if (!existing) throw new NotFoundError("payment method not found")

  const method = await StorePaymentMethodModel.update(req.params.id, req.body)
  sendResponse(res, 200, "payment method updated", method)
}

export async function deletePaymentMethod(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  getOwnerId(req)
  const existing = await StorePaymentMethodModel.getById(req.params.id)
  if (!existing) throw new NotFoundError("payment method not found")

  await StorePaymentMethodModel.delete(req.params.id)
  sendResponse(res, 200, "payment method deleted")
}
