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
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { processMessage } from "@/ai/pipeline";
import { getOwnerIdOrFirst } from "@/middleware/owner";

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

function normalizeWahaPayload(body: any): {
  phone?: string;
  text?: string;
  name?: string;
  waMsgId?: string;
  session?: string;
  ownerId?: string;
  event?: string;
} {
  // WAHA webhook shape: { event, session, payload: { from, body, id, _data } }
  if (body && typeof body === "object" && body.payload && body.session) {
    const p = body.payload;
    const rawFrom: string =
      p.from ?? p._data?.from ?? p.participant ?? p._data?.participant ?? "";
    const phone = rawFrom.includes("@")
      ? rawFrom.split("@")[0]
      : rawFrom || undefined;
    const text: string | undefined =
      p.body ?? p._data?.body ?? p.text ?? p._data?.text ?? p.message?.body ?? undefined;
    const name: string | undefined =
      p._data?.notifyName ?? p.notifyName ?? p.pushName ?? p._data?.pushName ?? undefined;
    const waMsgId: string | undefined =
      (typeof p.id === "string" ? p.id : p._data?.id?.id ?? p._data?.id ?? p.id?._serialized) ??
      p.id ??
      undefined;
    // WAHA id can be object like { id: "...", _serialized: "..." }
    const normalizedId =
      typeof waMsgId === "object" && waMsgId !== null
        ? (waMsgId as any)._serialized ?? (waMsgId as any).id ?? String(waMsgId)
        : waMsgId;
    return {
      phone,
      text,
      name,
      waMsgId: normalizedId ? String(normalizedId) : undefined,
      session: body.session,
      event: body.event,
    };
  }
  // Legacy direct shape: { phone, text, name, waMsgId, ownerId, session }
  return {
    phone: body.phone,
    text: body.text,
    name: body.name,
    waMsgId: body.waMsgId ?? body.id,
    session: body.session,
    ownerId: body.ownerId,
    event: body.event,
  };
}

export const postMessage = async (req: Request, res: Response) => {
  const body = req.body ?? {};

  // Ignore non-message WAHA events (status, etc.)
  if (body.event && body.payload) {
    const ev: string = String(body.event);
    if (ev !== "message" && ev !== "message.any" && ev !== "message.ack") {
      return sendResponse(res, 200, `ignored event ${ev}`, null);
    }
    if (ev === "message.ack") {
      return sendResponse(res, 200, "ack ignored", null);
    }
  }

  const extracted = normalizeWahaPayload(body);

  const phone = extracted.phone?.toString().trim();
  const text = extracted.text?.toString();

  if (!phone) {
    throw new BadRequestError("phone is required (payload.from or body.phone)");
  }
  if (!text || !text.trim()) {
    throw new BadRequestError("text is required (payload.body or body.text)");
  }

  // Resolve ownerId: explicit > session name > DB lookup > fallback first user
  let ownerId: string | undefined = (extracted as any).ownerId ?? body.ownerId;
  const sessionName: string | undefined = extracted.session ?? body.session;

  if (!ownerId && sessionName) {
    if (sessionName.startsWith("store-")) {
      ownerId = sessionName.replace(/^store-/, "");
    } else {
      // Fallback: lookup by waSessionName
      try {
        const sess = await WaSessionModel.findBySessionName(sessionName);
        if (sess) ownerId = sess.ownerId;
      } catch {
        // ignore lookup failure, will fallback to getOwnerIdOrFirst
      }
    }
  }

  if (!ownerId) {
    ownerId = await getOwnerIdOrFirst(req);
  }

  const result = await processMessage({
    ownerId,
    phone,
    name: extracted.name,
    text,
    waMsgId: extracted.waMsgId,
  });

  sendResponse(res, 200, "ok", {
    reply: result.reply,
    intent: result.intent,
    qrisImageUrl: result.qrisImageUrl ?? null,
  });
};
