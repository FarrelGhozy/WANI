import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ApiKeyModel, type ApiKeyScope } from "@/models/api-key";
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";

const INSECURE_PLACEHOLDERS = new Set([
  "change-me",
  "change-me-to-a-random-secret",
  "rahasia123",
]);

function secureLegacyToken(): string | null {
  if (process.env.ALLOW_LEGACY_API_TOKEN !== "true") return null;
  const token = process.env.API_TOKEN?.trim() ?? "";
  if (token.length < 32 || INSECURE_PLACEHOLDERS.has(token)) return null;
  return token;
}

function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function requireServiceAuth(scope: ApiKeyScope) {
  return async function serviceAuthMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedError();

    const legacyToken = secureLegacyToken();
    if (legacyToken && safeEqual(token, legacyToken)) {
      req.serviceAuth = {
        apiKeyId: "legacy",
        ownerId: null,
        name: "Legacy API_TOKEN",
        scopes: ["*"],
      };
      next();
      return;
    }

    const apiKey = await ApiKeyModel.authenticate(token);
    if (!apiKey) throw new UnauthorizedError("invalid, expired, or revoked API key");
    if (!apiKey.scopes.includes(scope)) {
      throw new ForbiddenError(`API key is missing scope: ${scope}`);
    }

    req.serviceAuth = {
      apiKeyId: apiKey.id,
      ownerId: apiKey.ownerId,
      name: apiKey.name,
      scopes: apiKey.scopes,
    };
    next();
  };
}

/** Backward-compatible name for the only current service endpoint. */
export const requireAuth = requireServiceAuth("sessions:messages");
