import type { Request, Response } from "express"
import type { z } from "zod"
import { WaSessionModel } from "@/src/models/wa-session"
import { sendResponse } from "@/src/utils/response"
import { upsertQrSchema, pairingSchema } from "@/src/schemas/wa-session"
import { clearBotCreds } from "@/src/utils/wa-bot-db"
import { BadRequestError } from "@/src/utils/errors"

type UpsertQrBody = z.infer<typeof upsertQrSchema>
type PairingBody = z.infer<typeof pairingSchema>

export async function getQr(req: Request, res: Response): Promise<void> {
  const ownerId = req.user!.id
  const session = await WaSessionModel.find(ownerId)
  sendResponse(res, 200, "qr retrieved", { qr: session?.qr ?? null })
}

export async function getStatus(req: Request, res: Response): Promise<void> {
  const ownerId = req.user!.id
  const session = await WaSessionModel.find(ownerId)
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
  const { ownerId, qr, status, phone, pairingCode, pairingPhone } = req.body
  await WaSessionModel.upsert(ownerId!, { qr, status, phone, pairingCode, pairingPhone })
  sendResponse(res, 200, "qr updated")
}

export async function requestPairing(
  req: Request<Record<string, string>, any, PairingBody>,
  res: Response,
): Promise<void> {
  const ownerId = req.user!.id
  const { phone } = req.body
  await WaSessionModel.upsert(ownerId, { pairingPhone: phone, pairingCode: null })
  sendResponse(res, 200, "pairing code requested", { phone })
}

export async function clearQr(req: Request, res: Response): Promise<void> {
  const ownerId = req.body.ownerId ?? req.query.ownerId
  if (!ownerId || typeof ownerId !== "string") throw new BadRequestError("ownerId required")
  await WaSessionModel.clearQr(ownerId)
  sendResponse(res, 200, "qr cleared")
}

export async function clearBotQr(req: Request, res: Response): Promise<void> {
  await WaSessionModel.clearQr(req.params.ownerId! as string)
  sendResponse(res, 200, "qr cleared")
}

export async function getActiveTenants(_req: Request, res: Response): Promise<void> {
  const ownerIds = await WaSessionModel.findActive()
  sendResponse(res, 200, "active tenants retrieved", { ownerIds })
}

export async function getBotSession(req: Request, res: Response): Promise<void> {
  const session = await WaSessionModel.find(req.params.ownerId! as string)
  sendResponse(res, 200, "session retrieved", {
    status: session?.status ?? "disconnected",
    phone: session?.phone ?? null,
    qr: session?.qr ?? null,
    pairingPhone: session?.pairingPhone ?? null,
    pairingCode: session?.pairingCode ?? null,
  })
}

export async function resetQr(req: Request, res: Response): Promise<void> {
  const ownerId = req.user!.id
  await clearBotCreds(ownerId)
  await WaSessionModel.upsert(ownerId, { qr: null, status: "disconnected", phone: null, pairingCode: null, pairingPhone: null })
  sendResponse(res, 200, "reset berhasil — bot akan scan QR baru")
}

export async function refreshPairing(req: Request, res: Response): Promise<void> {
  const ownerId = req.user!.id
  await WaSessionModel.upsert(ownerId, { pairingCode: null })
  sendResponse(res, 200, "pairing code cleared — bot akan generate kode baru")
}
