import { expect, test, describe, mock, afterEach } from "bun:test";

const mockUpsert = mock((args: any) =>
  Promise.resolve({
    id: "uuid-1",
    ownerId: "owner-1",
    waSessionName: "store-owner-1",
    status: "STOPPED",
    phone: null,
    qr: null,
    pairingPhone: null,
    pairingCode: null,
    lastSeenActiveAt: null,
    lastSyncedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
);

mock.module("@/config/db", () => ({
  prisma: {
    waSession: {
      upsert: mockUpsert,
      findUnique: mock((args: any) =>
        Promise.resolve({
          id: "uuid-1",
          ownerId: "owner-1",
          waSessionName: "store-owner-1",
          status: "STOPPED",
          phone: "628123456789",
          qr: null,
          pairingPhone: null,
          pairingCode: null,
          lastSeenActiveAt: null,
          lastSyncedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ),
      update: mock((args: any) => Promise.resolve({})),
    },
  } as any,
}));

import { WaSessionModel } from "@/models/wa-session";

describe("WaSessionModel.upsertByOwner", () => {
  afterEach(() => {
    mockUpsert.mockClear();
  });

  test("upsertByOwner with phone passes phone to prisma", async () => {
    await WaSessionModel.upsertByOwner("owner-1", {
      qr: null,
      phone: null,
    });

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const call = mockUpsert.mock.calls[0]?.[0];
    expect(call.where).toEqual({ ownerId: "owner-1" });
    expect(call.update).toMatchObject({
      qr: null,
      phone: null,
    });
  });

  test("upsertByOwner sets waSessionName in create", async () => {
    await WaSessionModel.upsertByOwner("owner-1", { phone: "628123456789" });

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const call = mockUpsert.mock.calls[0]?.[0];
    expect(call.create).toMatchObject({
      ownerId: "owner-1",
      waSessionName: "store-owner-1",
      phone: "628123456789",
    });
  });

  test("findByOwner calls findUnique with ownerId", async () => {
    const session = await WaSessionModel.findByOwner("owner-1");
    expect(session).not.toBeNull();
    expect(session?.ownerId).toBe("owner-1");
    expect(session?.phone).toBe("628123456789");
  });
});
