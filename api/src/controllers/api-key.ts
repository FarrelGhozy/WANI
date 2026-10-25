import type { Request, Response } from "express";
import type { z } from "zod";
import { ApiKeyModel } from "@/models/api-key";
import { getOwnerId } from "@/middleware/owner";
import { sendResponse } from "@/utils/response";
import { createApiKeySchema } from "@/schemas/api-key";

type CreateApiKeyBody = z.infer<typeof createApiKeySchema>;

export async function listApiKeys(req: Request, res: Response): Promise<void> {
  const ownerId = getOwnerId(req);
  const items = await ApiKeyModel.list(ownerId);
  sendResponse(res, 200, "API keys retrieved", { items });
}

export async function createApiKey(
  req: Request<Record<string, string>, any, CreateApiKeyBody>,
  res: Response
): Promise<void> {
  const ownerId = getOwnerId(req);
  const expiresAt = new Date(
    Date.now() + req.body.expiresInDays * 24 * 60 * 60 * 1000
  );
  const result = await ApiKeyModel.create(ownerId, {
    name: req.body.name,
    scopes: req.body.scopes,
    expiresAt,
  });
  sendResponse(res, 201, "API key created; copy the token now", result);
}

export async function revokeApiKey(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  const ownerId = getOwnerId(req);
  const apiKey = await ApiKeyModel.revoke(ownerId, req.params.id);
  sendResponse(res, 200, "API key revoked", apiKey);
}
