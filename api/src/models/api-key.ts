import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/config/db";
import { NotFoundError } from "@/utils/errors";

export const API_KEY_SCOPES = [
  "sessions:messages",
  "sessions:qr",
  "chat:write",
  "outgoing:read",
  "outgoing:write",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export type ApiKeyPublic = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

type AuthenticatedApiKey = {
  id: string;
  ownerId: string;
  name: string;
  scopes: string[];
};

function hashToken(token: string): Buffer {
  return createHash("sha256").update(token).digest();
}

function toPublic(row: {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}): ApiKeyPublic {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scopes: row.scopes,
    expiresAt: row.expiresAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class ApiKeyModel {
  static async create(
    ownerId: string,
    input: {
      name: string;
      scopes: ApiKeyScope[];
      expiresAt: Date;
    }
  ): Promise<{ apiKey: ApiKeyPublic; token: string }> {
    const prefix = randomBytes(6).toString("hex");
    const secret = randomBytes(32).toString("base64url");
    const token = `wani_sk_${prefix}_${secret}`;
    const row = await prisma.apiKey.create({
      data: {
        ownerId,
        name: input.name,
        prefix,
        secretHash: hashToken(token).toString("hex"),
        scopes: input.scopes,
        expiresAt: input.expiresAt,
      },
    });
    return { apiKey: toPublic(row), token };
  }

  static async list(ownerId: string): Promise<ApiKeyPublic[]> {
    const rows = await prisma.apiKey.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toPublic);
  }

  static async revoke(ownerId: string, id: string): Promise<ApiKeyPublic> {
    const existing = await prisma.apiKey.findFirst({
      where: { id, ownerId },
    });
    if (!existing) throw new NotFoundError("API key not found");
    const row = await prisma.apiKey.update({
      where: { id, ownerId },
      data: { revokedAt: existing.revokedAt ?? new Date() },
    });
    return toPublic(row);
  }

  static async authenticate(token: string): Promise<AuthenticatedApiKey | null> {
    const match = /^wani_sk_([a-f0-9]{12})_[A-Za-z0-9_-]{40,}$/.exec(token);
    if (!match) return null;

    const row = await prisma.apiKey.findUnique({
      where: { prefix: match[1] },
    });
    if (!row || row.revokedAt || row.expiresAt <= new Date()) return null;

    const actual = hashToken(token);
    const expected = Buffer.from(row.secretHash, "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return null;
    }

    await prisma.apiKey.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      scopes: row.scopes,
    };
  }
}
