import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockCreate = mock(async (args: any) => ({
  id: "key-1",
  ...args.data,
  revokedAt: null,
  lastUsedAt: null,
  createdAt: new Date("2026-08-31T00:00:00.000Z"),
}));
const mockFindMany = mock(async (_args: any): Promise<any[]> => []);
const mockFindFirst = mock(async (_args: any): Promise<any> => null);
const mockFindUnique = mock(async (_args: any): Promise<any> => null);
const mockUpdate = mock(async (args: any): Promise<any> => ({
  id: "key-1",
  ownerId: "owner-1",
  name: "WAHA",
  prefix: "abcdef123456",
  secretHash: "",
  scopes: ["sessions:messages"],
  expiresAt: new Date("2026-12-01T00:00:00.000Z"),
  revokedAt: args.data.revokedAt ?? null,
  lastUsedAt: args.data.lastUsedAt ?? null,
  createdAt: new Date("2026-08-31T00:00:00.000Z"),
}));

mock.module("@/config/db", () => ({
  prisma: {
    apiKey: {
      create: mockCreate,
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  } as any,
}));

import { ApiKeyModel } from "@/models/api-key";
import { createApiKeySchema } from "@/schemas/api-key";

describe("ApiKeyModel", () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFindMany.mockClear();
    mockFindFirst.mockClear();
    mockFindUnique.mockClear();
    mockUpdate.mockClear();
  });

  test("creates a one-time token but stores only its hash", async () => {
    const result = await ApiKeyModel.create("owner-1", {
      name: "WAHA",
      scopes: ["sessions:messages"],
      expiresAt: new Date("2026-12-01T00:00:00.000Z"),
    });

    expect(result.token).toMatch(/^wani_sk_[a-f0-9]{12}_[A-Za-z0-9_-]{40,}$/);
    const data = mockCreate.mock.calls[0]?.[0].data;
    expect(data.ownerId).toBe("owner-1");
    expect(data.secretHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.secretHash).not.toContain(result.token);
  });

  test("authenticates an active key and records last use", async () => {
    const created = await ApiKeyModel.create("owner-1", {
      name: "WAHA",
      scopes: ["sessions:messages"],
      expiresAt: new Date("2099-12-01T00:00:00.000Z"),
    });
    const data = mockCreate.mock.calls[0]?.[0].data;
    mockFindUnique.mockResolvedValueOnce({
      id: "key-1",
      ...data,
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
    });

    const authenticated = await ApiKeyModel.authenticate(created.token);

    expect(authenticated).toMatchObject({
      id: "key-1",
      ownerId: "owner-1",
      scopes: ["sessions:messages"],
    });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("rejects expired keys", async () => {
    const created = await ApiKeyModel.create("owner-1", {
      name: "Old",
      scopes: ["sessions:messages"],
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    const data = mockCreate.mock.calls[0]?.[0].data;
    mockFindUnique.mockResolvedValueOnce({
      id: "key-1",
      ...data,
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
    });

    expect(await ApiKeyModel.authenticate(created.token)).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("cannot revoke another owner's key", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    await expect(ApiKeyModel.revoke("owner-1", "foreign-key")).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("createApiKeySchema", () => {
  test("requires scopes and caps expiry at one year", () => {
    expect(
      createApiKeySchema.safeParse({
        name: "WAHA",
        scopes: [],
        expiresInDays: 90,
      }).success
    ).toBe(false);
    expect(
      createApiKeySchema.safeParse({
        name: "WAHA",
        scopes: ["sessions:messages"],
        expiresInDays: 366,
      }).success
    ).toBe(false);
  });
});
