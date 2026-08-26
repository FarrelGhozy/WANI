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
      const status = live.data.status;
      const synced = await WaSessionModel.upsertByOwner(ownerId, {
        status,
        phone: live.data.me?.id ?? session.phone,
        lastSyncedAt: new Date(),
      });

      // Keep the stored QR fresh while pairing is pending; drop it once connected.
      if (status === "SCAN_QR_CODE") {
        return (await this.refreshQr(ownerId)) ?? synced;
      }
      if (status === "WORKING" && synced.qr) {
        return WaSessionModel.upsertByOwner(ownerId, { qr: null });
      }
      return synced;
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

  /**
   * Push a text message to a customer through the owner's WA session.
   * Returns the WAHA message id on success, null when no session exists.
   */
  async sendText(
    ownerId: string,
    phone: string,
    text: string
  ): Promise<{ messageId: string } | null> {
    const session = await WaSessionModel.findByOwner(ownerId);
    if (!session) return null;

    const chatId = phone.includes("@") ? phone : `${phone}@c.us`;
    try {
      const res = await this.apiInstance.post<{ id: string }>("/sendText", {
        session: session.waSessionName,
        chatId,
        text,
      });
      return { messageId: res.data.id };
    } catch (err) {
      throw new InternalServerError("Failed to send message via WAHA", err);
    }
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
      const res = await this.apiInstance.post<
        Record<string, string | undefined>
      >(`/sessions/${session.waSessionName}/auth/request-code`, {
        phoneNumber: phone,
      });

      // WAHA may return the pairing code directly (code / pairingCode) or via async webhook.
      // Persist whatever it returns so the dashboard can show it immediately.
      const raw = res.data as Record<string, any> | undefined;
      const pairingCode =
        (raw?.code as string | undefined) ??
        (raw?.pairingCode as string | undefined) ??
        (raw?.pairing_code as string | undefined) ??
        null;

      return WaSessionModel.upsertByOwner(ownerId, {
        pairingPhone: phone,
        pairingCode,
      });
    } catch (err) {
      throw new InternalServerError("Failed to request pairing code from WAHA", err);
    }
  }

  /**
   * Fetch the current QR (as a data URI) for the owner's session and
   * persist it on the row. Returns null when no session exists.
   */
  async refreshQr(ownerId: string): Promise<WaSession | null> {
    const session = await WaSessionModel.findByOwner(ownerId);
    if (!session) return null;

    try {
      const res = await this.apiInstance.get<Record<string, string>>(
        `/sessions/${session.waSessionName}/auth/qr`,
        { headers: { Accept: "application/json" } }
      );
      const qr = typeof res.data?.qr === "string" ? res.data.qr : "";
      return WaSessionModel.upsertByOwner(ownerId, { qr: qr || null });
    } catch (err) {
      // Not in SCAN_QR_CODE state (or WAHA down) — keep last known QR.
      logger.debug("QR fetch skipped", {
        err: isAxiosError(err) ? err.message : String(err),
      });
      return session;
    }
  }

  /**
   * Log the session out on WAHA and remove the local row.
   * Returns false when the owner has no session.
   */
  async deleteSession(ownerId: string): Promise<boolean> {
    const session = await WaSessionModel.findByOwner(ownerId);
    if (!session) return false;

    try {
      await this.apiInstance.post(`/sessions/${session.waSessionName}/logout`);
    } catch (err) {
      if (!isAxiosError(err) || err.response?.status !== 404) {
        logger.error("Failed to logout session during delete", { err });
      }
    }
    try {
      await this.apiInstance.delete(`/sessions/${session.waSessionName}`);
    } catch (err) {
      if (!isAxiosError(err) || err.response?.status !== 404) {
        logger.error("Failed to delete session from WAHA", { err });
      }
    }

    await WaSessionModel.deleteByOwner(ownerId);
    return true;
  }
}

const wahaService = new WahaService();

export default wahaService;
