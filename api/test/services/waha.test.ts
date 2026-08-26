import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";

const mockAxiosPost = mock();
const mockAxiosGet = mock();
const mockAxiosDelete = mock();

mock.module("axios", () => ({
  default: {
    create: mock(() => ({
      post: mockAxiosPost,
      get: mockAxiosGet,
      delete: mockAxiosDelete,
      defaults: { headers: {} },
    })),
    isAxiosError: mock((err: any) => err?.isAxiosError === true),
  },
  isAxiosError: mock((err: any) => err?.isAxiosError === true),
}));

const mockWaSessionFindByOwner = mock();
const mockWaSessionUpsertByOwner = mock();
const mockWaSessionDeleteByOwner = mock();
const mockStoreFindByOwner = mock();

mock.module("@/config/db", () => ({
  prisma: {
    waSession: {
      findUnique: mockWaSessionFindByOwner,
      upsert: mockWaSessionUpsertByOwner,
      delete: mockWaSessionDeleteByOwner,
    },
    store: {
      findUnique: mockStoreFindByOwner,
    },
  } as any,
}));

mock.module("@/config/env", () => ({
  env: {
    nodeEnv: "test",
    ai: {
      llmApiKey: "test",
      openrouterApiKey: "test",
      llmBaseUrl: "https://openrouter.ai/api/v1/chat/completions",
      defaultModel: "test",
      fallbackModel: "test",
      maxTokens: 2048,
      temperature: 0.7,
    },
    auth: { jwtSecret: "test-secret", jwtExpires: "7d" },
    email: { smtpHost: "", smtpPort: 587, smtpUser: "", smtpPassword: "", smtpFrom: "" },
    cors: { allowedOrigins: ["http://localhost:5173"] },
    guardrails: {
      maxInputChars: 4000,
      maxReplyChars: 1500,
      rateShortMax: 8,
      rateShortWindowMs: 30_000,
      rateLongMax: 60,
      rateLongWindowMs: 3_600_000,
      dailyLlmBudget: 2000,
      classifierEnabled: true,
      classifierModel: "test",
      judgeEnabled: true,
      judgeModel: "test",
      groundingEnabled: true,
      groundingModel: "test",
    },
    waha: {
      apiUrl: "http://localhost:3000",
      apiKey: "test-api-key",
    },
  } as any,
}));

mock.module("@/config/logger", () => ({
  logger: {
    debug: mock(),
    error: mock(),
    warn: mock(),
    info: mock(),
  },
  morganStream: { write: mock() },
}));

import WahaService from "@/services/waha";

// Ensure axios instance uses our mocks even if mock.module hoisting fails
const _wahaApi = (WahaService as any).apiInstance;
if (_wahaApi) {
  _wahaApi.post = mockAxiosPost;
  _wahaApi.get = mockAxiosGet;
  _wahaApi.delete = mockAxiosDelete;
}
import { WaSessionModel } from "@/models/wa-session";
import { StoreModel } from "@/models/store";
import { InternalServerError, NotFoundError } from "@/utils/errors";

const createMockSession = (overrides = {}) => ({
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
  ...overrides,
});

const createMockStore = (overrides = {}) => ({
  id: "store-1",
  ownerId: "owner-1",
  businessName: "Test Store",
  ...overrides,
});

const createAxiosError = (status: number, message = "Request failed") => {
  const err = new Error(message) as any;
  err.isAxiosError = true;
  err.response = { status, data: { message } };
  return err;
};

describe("WahaService", () => {
  beforeEach(() => {
    mockAxiosPost.mockClear();
    mockAxiosGet.mockClear();
    mockAxiosDelete.mockClear();
    mockWaSessionFindByOwner.mockClear();
    mockWaSessionUpsertByOwner.mockClear();
    mockWaSessionDeleteByOwner.mockClear();
    mockStoreFindByOwner.mockClear();
  });

  describe("getOrCreateSession", () => {
    test("returns existing session if found", async () => {
      const existing = createMockSession({ status: "WORKING" });
      mockWaSessionFindByOwner.mockResolvedValue(existing);

      const result = await WahaService.getOrCreateSession("owner-1", "Test Store");

      expect(result).toEqual(existing);
      expect(mockWaSessionFindByOwner).toHaveBeenCalledWith({ where: { ownerId: "owner-1" } });
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    test("creates new session in WAHA and upserts in DB", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);
      mockAxiosPost.mockResolvedValue({
        data: {
          name: "store-owner-1",
          status: "SCAN_QR_CODE",
          engine: { engine: "GOWS" },
          config: {},
          me: null,
        },
      });
      mockWaSessionUpsertByOwner.mockResolvedValue(
        createMockSession({ status: "SCAN_QR_CODE", lastSyncedAt: new Date() })
      );

      const result = await WahaService.getOrCreateSession("owner-1", "Test Store");

      expect(mockAxiosPost).toHaveBeenCalledWith("/sessions", {
        name: "store-owner-1",
        config: expect.objectContaining({
          metadata: { storeId: "owner-1", storeName: "Test Store" },
        }),
        start: true,
      });
      expect(mockWaSessionUpsertByOwner).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: "owner-1" },
          create: expect.objectContaining({
            waSessionName: "store-owner-1",
            status: "SCAN_QR_CODE",
          }),
        })
      );
      expect(result.status).toBe("SCAN_QR_CODE");
    });

    test("handles 409 conflict - returns existing session", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);
      mockAxiosPost.mockRejectedValue(createAxiosError(409, "Conflict"));
      const existing = createMockSession({ status: "WORKING" });
      mockWaSessionFindByOwner.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);

      const result = await WahaService.getOrCreateSession("owner-1", "Test Store");

      expect(result).toEqual(existing);
    });

    test("throws InternalServerError on other errors", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);
      mockAxiosPost.mockRejectedValue(createAxiosError(500, "Server error"));

      await expect(WahaService.getOrCreateSession("owner-1", "Test Store")).rejects.toThrow(InternalServerError);
    });
  });

  describe("syncSessionWithWaha", () => {
    test("returns null if no session exists", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);

      const result = await WahaService.syncSessionWithWaha("owner-1");

      expect(result).toBeNull();
    });

    test("syncs session status from WAHA", async () => {
      const session = createMockSession({ status: "STOPPED" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosGet.mockResolvedValue({
        data: {
          name: "store-owner-1",
          status: "WORKING",
          engine: { engine: "GOWS" },
          config: {},
          me: { id: "628123456789@c.us", pushName: "Test" },
        },
      });
      mockWaSessionUpsertByOwner.mockResolvedValue(
        createMockSession({ status: "WORKING", phone: "628123456789@c.us", lastSyncedAt: new Date() })
      );

      const result = await WahaService.syncSessionWithWaha("owner-1");

      expect(mockAxiosGet).toHaveBeenCalledWith("/sessions/store-owner-1");
      expect(mockWaSessionUpsertByOwner).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: "owner-1" },
          create: expect.objectContaining({ status: "WORKING" }),
        })
      );
      expect(result?.status).toBe("WORKING");
    });

    test("refreshes QR when status is SCAN_QR_CODE", async () => {
      const session = createMockSession({ status: "SCAN_QR_CODE" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosGet
        .mockResolvedValueOnce({
          data: {
            name: "store-owner-1",
            status: "SCAN_QR_CODE",
            engine: { engine: "GOWS" },
            config: {},
            me: null,
          },
        })
        .mockResolvedValueOnce({
          data: { qr: "data:image/png;base64,mockqr" },
        });
      mockWaSessionUpsertByOwner.mockResolvedValue(
        createMockSession({ status: "SCAN_QR_CODE", qr: "data:image/png;base64,mockqr", lastSyncedAt: new Date() })
      );

      const result = await WahaService.syncSessionWithWaha("owner-1");

      expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      expect(result?.qr).toBe("data:image/png;base64,mockqr");
    });

    test("clears QR when status becomes WORKING", async () => {
      const session = createMockSession({ status: "SCAN_QR_CODE", qr: "old-qr" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosGet.mockResolvedValue({
        data: {
          name: "store-owner-1",
          status: "WORKING",
          engine: { engine: "GOWS" },
          config: {},
          me: { id: "628123456789@c.us", pushName: "Test" },
        },
      });
      mockWaSessionUpsertByOwner
        .mockResolvedValueOnce(createMockSession({ status: "WORKING", phone: "628123456789@c.us", qr: "old-qr", lastSyncedAt: new Date() }))
        .mockResolvedValueOnce(createMockSession({ status: "WORKING", phone: "628123456789@c.us", qr: null, lastSyncedAt: new Date() }));

      const result = await WahaService.syncSessionWithWaha("owner-1");

      expect(mockWaSessionUpsertByOwner).toHaveBeenCalledTimes(2);
      expect(result?.qr).toBeNull();
    });

    test("marks session STOPPED on 404 from WAHA", async () => {
      const session = createMockSession({ status: "WORKING" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosGet.mockRejectedValue(createAxiosError(404, "Not found"));
      mockWaSessionUpsertByOwner.mockResolvedValue(
        createMockSession({ status: "STOPPED", lastSyncedAt: new Date() })
      );

      const result = await WahaService.syncSessionWithWaha("owner-1");

      expect(result?.status).toBe("STOPPED");
    });

    test("throws InternalServerError on other errors", async () => {
      const session = createMockSession({ status: "WORKING" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosGet.mockRejectedValue(createAxiosError(500, "Server error"));

      await expect(WahaService.syncSessionWithWaha("owner-1")).rejects.toThrow(InternalServerError);
    });
  });

  describe("getSession", () => {
    test("returns session from DB", async () => {
      const session = createMockSession({ status: "WORKING" });
      mockWaSessionFindByOwner.mockResolvedValue(session);

      const result = await WahaService.getSession("owner-1");

      expect(result).toEqual(session);
    });

    test("returns null if no session", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);

      const result = await WahaService.getSession("owner-1");

      expect(result).toBeNull();
    });
  });

  describe("sendText", () => {
    test("returns null if no session", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);

      const result = await WahaService.sendText("owner-1", "628123456789", "Hello");

      expect(result).toBeNull();
    });

    test("sends message via WAHA and returns messageId", async () => {
      const session = createMockSession({ status: "WORKING", waSessionName: "store-owner-1" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosPost.mockResolvedValue({ data: { id: "waha-msg-123" } });

      const result = await WahaService.sendText("owner-1", "628123456789", "Hello");

      expect(mockAxiosPost).toHaveBeenCalledWith("/sendText", {
        session: "store-owner-1",
        chatId: "628123456789@c.us",
        text: "Hello",
      });
      expect(result).toEqual({ messageId: "waha-msg-123" });
    });

    test("handles phone numbers already with @c.us", async () => {
      const session = createMockSession({ status: "WORKING", waSessionName: "store-owner-1" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosPost.mockResolvedValue({ data: { id: "waha-msg-123" } });

      await WahaService.sendText("owner-1", "628123456789@c.us", "Hello");

      expect(mockAxiosPost).toHaveBeenCalledWith("/sendText", expect.objectContaining({
        chatId: "628123456789@c.us",
      }));
    });

    test("throws InternalServerError on failure", async () => {
      const session = createMockSession({ status: "WORKING", waSessionName: "store-owner-1" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosPost.mockRejectedValue(createAxiosError(500, "Failed"));

      await expect(WahaService.sendText("owner-1", "628123456789", "Hello")).rejects.toThrow(InternalServerError);
    });
  });

  describe("resetSession", () => {
    test("throws if no session exists", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);

      await expect(WahaService.resetSession("owner-1")).rejects.toThrow(InternalServerError);
    });

    test("throws if store not found", async () => {
      const session = createMockSession();
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockStoreFindByOwner.mockResolvedValue(null);

      await expect(WahaService.resetSession("owner-1")).rejects.toThrow(NotFoundError);
    });

    test("logs out old session, creates new one, returns updated session", async () => {
      const session = createMockSession({ waSessionName: "store-owner-1" });
      const store = createMockStore();
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockStoreFindByOwner.mockResolvedValue(store);
      mockAxiosPost.mockResolvedValueOnce({}); // logout
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          name: "store-owner-1",
          status: "SCAN_QR_CODE",
          engine: { engine: "GOWS" },
          config: {},
          me: null,
        },
      });
      mockWaSessionUpsertByOwner.mockResolvedValue(
        createMockSession({ status: "SCAN_QR_CODE", qr: null, pairingCode: null, pairingPhone: null, lastSyncedAt: new Date() })
      );

      const result = await WahaService.resetSession("owner-1");

      expect(mockAxiosPost).toHaveBeenCalledTimes(2);
      expect(mockAxiosPost).toHaveBeenNthCalledWith(1, "/sessions/store-owner-1/logout");
      expect(mockAxiosPost).toHaveBeenNthCalledWith(2, "/sessions", expect.objectContaining({
        name: "store-owner-1",
        start: true,
      }));
      expect(result.status).toBe("SCAN_QR_CODE");
      expect(result.qr).toBeNull();
      expect(result.pairingCode).toBeNull();
    });

    test("continues even if logout fails with 404", async () => {
      const session = createMockSession({ waSessionName: "store-owner-1" });
      const store = createMockStore();
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockStoreFindByOwner.mockResolvedValue(store);
      mockAxiosPost.mockRejectedValueOnce(createAxiosError(404, "Not found"));
      mockAxiosPost.mockResolvedValueOnce({
        data: { name: "store-owner-1", status: "SCAN_QR_CODE", engine: { engine: "GOWS" }, config: {}, me: null },
      });
      mockWaSessionUpsertByOwner.mockResolvedValue(createMockSession({ status: "SCAN_QR_CODE" }));

      const result = await WahaService.resetSession("owner-1");

      expect(result.status).toBe("SCAN_QR_CODE");
    });
  });

  describe("requestPairingCode", () => {
    test("throws if no session exists", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);

      await expect(WahaService.requestPairingCode("owner-1", "628123456789")).rejects.toThrow(InternalServerError);
    });

    test("requests pairing code from WAHA with phoneNumber", async () => {
      const session = createMockSession({ waSessionName: "store-owner-1" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosPost.mockResolvedValue({});
      mockWaSessionUpsertByOwner.mockResolvedValue(
        createMockSession({ pairingPhone: "628123456789", pairingCode: null })
      );

      const result = await WahaService.requestPairingCode("owner-1", "628123456789");

      expect(mockAxiosPost).toHaveBeenCalledWith("/sessions/store-owner-1/auth/request-code", {
        phoneNumber: "628123456789",
      });
      expect(result.pairingPhone).toBe("628123456789");
    });

    test("throws InternalServerError on failure", async () => {
      const session = createMockSession({ waSessionName: "store-owner-1" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosPost.mockRejectedValue(createAxiosError(500, "Failed"));

      await expect(WahaService.requestPairingCode("owner-1", "628123456789")).rejects.toThrow(InternalServerError);
    });
  });

  describe("refreshQr", () => {
    test("returns null if no session", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);

      const result = await WahaService.refreshQr("owner-1");

      expect(result).toBeNull();
    });

    test("fetches QR from WAHA and upserts", async () => {
      const session = createMockSession({ waSessionName: "store-owner-1" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosGet.mockResolvedValue({ data: { qr: "data:image/png;base64,newqr" } });
      mockWaSessionUpsertByOwner.mockResolvedValue(
        createMockSession({ qr: "data:image/png;base64,newqr" })
      );

      const result = await WahaService.refreshQr("owner-1");

      expect(mockAxiosGet).toHaveBeenCalledWith("/sessions/store-owner-1/auth/qr", {
        headers: { Accept: "application/json" },
      });
      expect(result?.qr).toBe("data:image/png;base64,newqr");
    });

    test("returns existing session on error (keeps last known QR)", async () => {
      const session = createMockSession({ waSessionName: "store-owner-1", qr: "old-qr" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosGet.mockRejectedValue(createAxiosError(400, "Bad request"));

      const result = await WahaService.refreshQr("owner-1");

      expect(result).toEqual(session);
    });
  });

  describe("deleteSession", () => {
    test("returns false if no session", async () => {
      mockWaSessionFindByOwner.mockResolvedValue(null);

      const result = await WahaService.deleteSession("owner-1");

      expect(result).toBeFalse();
    });

    test("logs out and deletes session from WAHA, removes from DB", async () => {
      const session = createMockSession({ waSessionName: "store-owner-1" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosPost.mockResolvedValue({}); // logout
      mockAxiosDelete.mockResolvedValue({}); // delete
      mockWaSessionDeleteByOwner.mockResolvedValue({});

      const result = await WahaService.deleteSession("owner-1");

      expect(mockAxiosPost).toHaveBeenCalledWith("/sessions/store-owner-1/logout");
      expect(mockAxiosDelete).toHaveBeenCalledWith("/sessions/store-owner-1");
      expect(mockWaSessionDeleteByOwner).toHaveBeenCalledWith({ where: { ownerId: "owner-1" } });
      expect(result).toBeTrue();
    });

    test("continues even if logout/delete fail with 404", async () => {
      const session = createMockSession({ waSessionName: "store-owner-1" });
      mockWaSessionFindByOwner.mockResolvedValue(session);
      mockAxiosPost.mockRejectedValue(createAxiosError(404, "Not found"));
      mockAxiosDelete.mockRejectedValue(createAxiosError(404, "Not found"));
      mockWaSessionDeleteByOwner.mockResolvedValue({});

      const result = await WahaService.deleteSession("owner-1");

      expect(result).toBeTrue();
    });
  });
});