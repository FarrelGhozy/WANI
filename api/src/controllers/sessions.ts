import { type Request, type Response } from "express";
import { z } from "zod";

import WahaService from "@/services/waha";
import { sendResponse } from "@/utils/response";
import { createSessionSchema, getSessionsByIdSchema } from "@/schemas/sessions";
import { randomBytes } from "crypto";

type CreateSessionBody = z.infer<typeof createSessionSchema>;
type GetSessionByIdParams = z.infer<typeof getSessionsByIdSchema>;

export const getSessionsByStoreId = async (
  req: Request<GetSessionByIdParams>,
  res: Response
) => {
  // User ID is to the same as the Store ID
  const userId = req.user?.id!;
  const { uuid: storeId } = req.params;

  const sessions = await WahaService.getAllSessionsByStoreId(userId, storeId);
  sendResponse(res, 200, "Sessions retrieved successfully", sessions);
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
