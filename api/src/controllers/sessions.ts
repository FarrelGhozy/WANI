import { type Request, type Response } from "express";
import { z } from "zod";

import WahaService from "@/services/waha";
import { sendResponse } from "@/utils/response";
import { createSessionSchema } from "@/schemas/sessions";

type CreateSessionBody = z.infer<typeof createSessionSchema>;

export const getAllSessions = async (req: Request, res: Response) => {
  const sessions = await WahaService.getAllSessions();
  sendResponse(res, 200, "Sessions retrieved successfully", sessions);
};

export const createSession = async (
  req: Request<{}, {}, CreateSessionBody>,
  res: Response
) => {
  const { storeId, storeName } = req.body;

  const session = await WahaService.createSession({
    config: {
      metadata: {
        storeId,
        storeName,
      },
    },
  });

  sendResponse(res, 201, "Session created successfully", session);
};
