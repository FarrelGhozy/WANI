import { type Request, type Response } from "express";
import { z } from "zod";

import WahaService from "@/services/waha";
import { sendResponse } from "@/utils/response";
import {
  createSessionSchema,
  sessionQuerySchema,
  pairingSchema,
} from "@/schemas/sessions";
import { StoreModel } from "@/models/store";
import { WaSessionModel } from "@/models/wa-session";
import { NotFoundError } from "@/utils/errors";

type CreateSessionBody = z.infer<typeof createSessionSchema>;
type SessionQuery = z.infer<typeof sessionQuerySchema>;
type PairingBody = z.infer<typeof pairingSchema>;

export const getSession = async (
  req: Request<{}, {}, {}, SessionQuery>,
  res: Response
) => {
  const ownerId = req.user?.id!;
  const { status } = req.query;

  const session = await WahaService.getSession(ownerId);

  if (!session) {
    return sendResponse(res, 200, "No session found for this store", null);
  }

  let result = session;
  if (status && session.status !== status) {
    result = null as any;
  }

  return sendResponse(
    res,
    200,
    result ? "Session retrieved successfully" : "No session matches the filter",
    result
  );
};

export const createSession = async (
  req: Request<{}, {}, CreateSessionBody>,
  res: Response
) => {
  const ownerId = req.user?.id!;

  const store = await StoreModel.findByOwner(ownerId);
  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const session = await WahaService.getOrCreateSession(ownerId, store.businessName);

  sendResponse(res, 201, "Session created successfully", session);
};

export const syncSession = async (
  req: Request,
  res: Response
) => {
  const ownerId = req.user?.id!;

  const session = await WahaService.syncSessionWithWaha(ownerId);

  sendResponse(
    res,
    200,
    session ? "Session synced successfully" : "No session found for this store",
    session
  );
};

export const resetSession = async (
  req: Request,
  res: Response
) => {
  const ownerId = req.user?.id!;

  const session = await WahaService.resetSession(ownerId);

  sendResponse(res, 200, "Session reset successfully", session);
};

export const requestPairing = async (
  req: Request<{}, {}, PairingBody>,
  res: Response
) => {
  const ownerId = req.user?.id!;
  const { phone } = req.body;

  const session = await WahaService.requestPairingCode(ownerId, phone);

  sendResponse(res, 200, "Pairing code requested", session);
};

export const refreshPairing = async (
  req: Request,
  res: Response
) => {
  const ownerId = req.user?.id!;

  const session = await WaSessionModel.findByOwner(ownerId);
  if (!session?.pairingPhone) {
    return sendResponse(res, 400, "No pairing phone on record. Request pairing first.", null);
  }

  const updated = await WahaService.requestPairingCode(ownerId, session.pairingPhone);

  sendResponse(res, 200, "Pairing code refreshed", updated);
};

export const deleteSession = async (
  req: Request,
  res: Response
) => {
  const ownerId = req.user?.id!;

  const deleted = await WahaService.deleteSession(ownerId);

  if (!deleted) {
    return sendResponse(res, 200, "No session found for this store", null);
  }

  sendResponse(res, 200, "Session deleted successfully", null);
};
