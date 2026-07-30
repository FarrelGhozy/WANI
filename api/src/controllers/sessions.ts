import { type Request, type Response } from "express";
import { z } from "zod";

import WahaService from "@/services/waha";
import { sendResponse } from "@/utils/response";
import {
  createSessionSchema,
  getSessionsByStoreIdSchema,
  getSessionsByStoreIdQuerySchema,
  getSessionByNameQuerySchema,
} from "@/schemas/sessions";
import { randomBytes } from "crypto";

type CreateSessionBody = z.infer<typeof createSessionSchema>;
type GetSessionByStoreIdParams = z.infer<typeof getSessionsByStoreIdSchema>;
type GetSessionByStoreIdQuery = z.infer<typeof getSessionsByStoreIdQuerySchema>;
type GetSessionByNameQuery = z.infer<typeof getSessionByNameQuerySchema>;

export const getSessionsByStoreId = async (
  req: Request<GetSessionByStoreIdParams, {}, {}, GetSessionByStoreIdQuery>,
  res: Response
) => {
  // User ID is to the same as the Store ID
  const userId = req.user?.id!;
  const { uuid: storeId } = req.params;

  const { status } = req.query;

  const sessions = await WahaService.getAllSessionsByStoreId(userId, storeId);

  let filteredSessions = sessions;

  if (status)
    filteredSessions = sessions.filter((session) => session.status === status);

  return sendResponse(
    res,
    200,
    filteredSessions.length > 0
      ? "Sessions retrieved successfully"
      : "No sessions found for this store",
    filteredSessions
  );
};

export const getSessionsByName = async (
  req: Request<{}, {}, {}, GetSessionByNameQuery>,
  res: Response
) => {
  const { name: sessionName } = req.query;
  const storeId = req.user?.id!;

  const sessions = await WahaService.getSessionsByName(sessionName, storeId);

  return sendResponse(
    res,
    200,
    sessions.length > 0
      ? "Sessions retrieved successfully"
      : "No sessions found for this name and store",
    sessions
  );
};

export const createSession = async (
  req: Request<{}, {}, CreateSessionBody>,
  res: Response
) => {
  const { storeId, storeName } = req.body;

  const session = await WahaService.createSession(req.user?.id!, {
    name: `sess-wani-${randomBytes(16).toHex()}`,
    config: {
      metadata: {
        storeId,
        storeName,
      },
    },
  });

  sendResponse(res, 201, "Session created successfully", session);
};
