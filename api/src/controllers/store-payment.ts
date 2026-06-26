import type { Request, Response } from "express"
import type { z } from "zod"
import { StorePaymentMethodModel } from "@/src/models/store-payment"
import { sendResponse } from "@/src/utils/response"
import { NotFoundError } from "@/src/utils/errors"
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from "@/src/schemas/store-payment"

type CreateBody = z.infer<typeof createPaymentMethodSchema>
type UpdateBody = z.infer<typeof updatePaymentMethodSchema>

export async function listPaymentMethods(
  _req: Request,
  res: Response,
): Promise<void> {
  const methods = await StorePaymentMethodModel.listByStore()
  sendResponse(res, 200, "payment methods retrieved", methods)
}

export async function createPaymentMethod(
  req: Request<Record<string, string>, any, CreateBody>,
  res: Response,
): Promise<void> {
  const data = {
    ...req.body,
    storeId: "default",
    isActive: true,
    sortOrder: 0,
    accountName: (req.body as any).accountName ?? null,
    accountNumber: (req.body as any).accountNumber ?? null,
    bankName: (req.body as any).bankName ?? null,
    providerName: (req.body as any).providerName ?? null,
    phoneNumber: (req.body as any).phoneNumber ?? null,
    qrImageUrl: (req.body as any).qrImageUrl ?? null,
    instructions: (req.body as any).instructions ?? null,
  }

  const method = await StorePaymentMethodModel.create(data as any)
  sendResponse(res, 201, "payment method created", method)
}

export async function updatePaymentMethod(
  req: Request<{ id: string }, any, UpdateBody>,
  res: Response,
): Promise<void> {
  const existing = await StorePaymentMethodModel.getById(req.params.id)
  if (!existing) throw new NotFoundError("payment method not found")

  const method = await StorePaymentMethodModel.update(req.params.id, req.body)
  sendResponse(res, 200, "payment method updated", method)
}

export async function deletePaymentMethod(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const existing = await StorePaymentMethodModel.getById(req.params.id)
  if (!existing) throw new NotFoundError("payment method not found")

  await StorePaymentMethodModel.delete(req.params.id)
  sendResponse(res, 200, "payment method deleted")
}
