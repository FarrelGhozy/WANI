import type { Request, Response } from "express"
import type { z } from "zod"
import { WaSessionModel } from "@/src/models/wa-session"
import { sendResponse } from "@/src/utils/response"
import { upsertQrSchema, pairingSchema } from "@/src/schemas/wa-session"
import { clearBotCreds } from "@/src/utils/wa-bot-db"

type UpsertQrBody = z.infer<typeof upsertQrSchema>
type PairingBody = z.infer<typeof pairingSchema>

export async function getQr(_req: Request, res: Response): Promise<void> {
  const session = await WaSessionModel.find()
  sendResponse(res, 200, "qr retrieved", { qr: session?.qr ?? null })
}

export async function getStatus(_req: Request, res: Response): Promise<void> {
  const session = await WaSessionModel.find()
  sendResponse(res, 200, "status retrieved", {
    status: session?.status ?? "disconnected",
    phone: session?.phone ?? null,
    connectedAt: session?.updatedAt?.toISOString() ?? null,
    pairingPhone: session?.pairingPhone ?? null,
    pairingCode: session?.pairingCode ?? null,
  })
}

export async function upsertQr(
  req: Request<Record<string, string>, any, UpsertQrBody>,
  res: Response,
): Promise<void> {
  const { qr, status, phone, pairingCode, pairingPhone } = req.body
  await WaSessionModel.upsert({ qr, status, phone, pairingCode, pairingPhone })
  sendResponse(res, 200, "qr updated")
}

export async function requestPairing(
  req: Request<Record<string, string>, any, PairingBody>,
  res: Response,
): Promise<void> {
  const { phone } = req.body
  await WaSessionModel.upsert({ pairingPhone: phone, pairingCode: null })
  sendResponse(res, 200, "pairing code requested", { phone })
}

export async function clearQr(_req: Request, res: Response): Promise<void> {
  await WaSessionModel.clearQr()
  sendResponse(res, 200, "qr cleared")
}

export async function resetQr(_req: Request, res: Response): Promise<void> {
  await clearBotCreds()
  await WaSessionModel.upsert({ qr: null, status: "disconnected", phone: null, pairingCode: null })
  sendResponse(res, 200, "reset berhasil — bot akan scan QR baru")
}
