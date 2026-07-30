import axios, { isAxiosError, type AxiosInstance } from "axios";

import type {
  CreateSessionResponse,
  GetSessionResponse,
  SessionConfig,
} from "@/types/waha";
import type { WaSession } from "@/types/wa-session";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { InternalServerError, NotFoundError } from "@/utils/errors";
import { StoreModel } from "@/models/store";
import { WaSessionModel } from "@/models/wa-session";

class WahaService {
  private readonly apiInstance: AxiosInstance;
  private readonly headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Api-Key": env.waha.apiKey,
  };
  private readonly sessionDefaultConfig: SessionConfig = {
    debug: false,
    client: {
      deviceName: "WANI Bot",
      browserName: "Firefox",
    },
    ignore: {
      status: true,
      groups: true,
      channels: true,
    },
  };

  constructor() {
    this.apiInstance = axios.create({
      baseURL: env.waha.apiUrl,
      headers: this.headers,
      timeout: 10000,
      timeoutErrorMessage: "Request to WAHA API timed out",
    });
  }

  async getOrCreateSession(ownerId: string, storeName: string) {
    const existing = await WaSessionModel.findByOwner(ownerId);
    if (existing) return existing;

    const waSessionName = `store-${ownerId}`;

    try {
      const created = await this.apiInstance.post<CreateSessionResponse>("/sessions", {
        name: waSessionName,
        config: {
          ...this.sessionDefaultConfig,
          metadata: { storeId: ownerId, storeName },
        },
        start: true,
      });

      return WaSessionModel.upsertByOwner(ownerId, {
        waSessionName,
        status: created.data.status,
        lastSeenActiveAt: null,
        lastSyncedAt: new Date(),
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        const existingAfterConflict = await WaSessionModel.findByOwner(ownerId);
        if (existingAfterConflict) return existingAfterConflict;
      }
      throw new InternalServerError("Failed to create session in WAHA", err);
    }
  }

  async syncSessionWithWaha(ownerId: string): Promise<WaSession | null> {
    const session = await WaSessionModel.findByOwner(ownerId);
    if (!session) return null;

    try {
      const live = await this.apiInstance.get<GetSessionResponse>(
        `/sessions/${session.waSessionName}`
      );
      return WaSessionModel.upsertByOwner(ownerId, {
        status: live.data.status,
        phone: live.data.me?.id ?? session.phone,
        lastSyncedAt: new Date(),
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        return WaSessionModel.upsertByOwner(ownerId, {
          status: "STOPPED",
          lastSyncedAt: new Date(),
        });
      }
      throw new InternalServerError("Failed to sync session with WAHA", err);
    }
  }

  async getSession(ownerId: string): Promise<WaSession | null> {
    return WaSessionModel.findByOwner(ownerId);
  }

  async resetSession(ownerId: string): Promise<WaSession> {
    const session = await WaSessionModel.findByOwner(ownerId);
    if (!session) {
      throw new InternalServerError("No session to reset. Create one first.");
    }

    const store = await StoreModel.findByOwner(ownerId);
    if (!store) {
      throw new NotFoundError("Store not found");
    }

    try {
      await this.apiInstance.post(`/sessions/${session.waSessionName}/logout`);
    } catch (err) {
      if (!isAxiosError(err) || err.response?.status !== 404) {
        logger.error("Failed to logout session during reset", { err });
      }
    }

    try {
      const created = await this.apiInstance.post<CreateSessionResponse>("/sessions", {
        name: session.waSessionName,
        config: {
          ...this.sessionDefaultConfig,
          metadata: { storeId: ownerId, storeName: store.businessName },
        },
        start: true,
      });

      return WaSessionModel.upsertByOwner(ownerId, {
        status: created.data.status,
        qr: null,
        pairingCode: null,
        pairingPhone: null,
        lastSeenActiveAt: null,
        lastSyncedAt: new Date(),
      });
    } catch (err) {
      throw new InternalServerError("Failed to restart session after reset", err);
    }
  }

  async requestPairingCode(ownerId: string, phone: string): Promise<WaSession> {
    const session = await WaSessionModel.findByOwner(ownerId);
    if (!session) {
      throw new InternalServerError("No session. Create one before requesting pairing code.");
    }

    try {
      await this.apiInstance.post(`/sessions/${session.waSessionName}/auth/request-code`, {
        phone,
      });

      return WaSessionModel.upsertByOwner(ownerId, {
        pairingPhone: phone,
        pairingCode: null,
      });
    } catch (err) {
      throw new InternalServerError("Failed to request pairing code from WAHA", err);
    }
  }
}

const wahaService = new WahaService();

export default wahaService;
