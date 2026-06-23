import type { Request, Response } from "express"
import type { z } from "zod"
import { WaSessionModel } from "@/src/models/wa-session"
import { sendResponse } from "@/src/utils/response"
import { upsertQrSchema } from "@/src/schemas/wa-session"

type UpsertQrBody = z.infer<typeof upsertQrSchema>

export async function getQr(_req: Request, res: Response): Promise<void> {
  const session = await WaSessionModel.find()
  sendResponse(res, 200, "qr retrieved", { qr: session?.qr ?? null })
}

export async function getStatus(_req: Request, res: Response): Promise<void> {
  const session = await WaSessionModel.find()
  sendResponse(res, 200, "status retrieved", {
    status: session?.status ?? "disconnected",
    phone: session?.phone ?? null,
  })
}

export async function upsertQr(
  req: Request<Record<string, string>, any, UpsertQrBody>,
  res: Response,
): Promise<void> {
  const { qr, status, phone } = req.body
  await WaSessionModel.upsert({ qr, status, phone })
  sendResponse(res, 200, "qr updated")
}

export async function clearQr(_req: Request, res: Response): Promise<void> {
  await WaSessionModel.clearQr()
  sendResponse(res, 200, "qr cleared")
}
