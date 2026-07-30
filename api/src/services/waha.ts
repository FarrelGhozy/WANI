import axios, { isAxiosError, type AxiosInstance } from "axios";
import { randomBytes } from "crypto";

import type {
  CreateSessionOptions,
  CreateSessionResponse,
  GetSessionResponse,
  SessionConfig,
} from "@/types/waha";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { ForbiddenError, InternalServerError } from "@/utils/errors";
import { UserModel, type UserPublic } from "@/models/user";

/**
 * Service for interacting with the WAHA API.
 */
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
      timeout: 10000, // 10 seconds timeout
      timeoutErrorMessage: "Request to WAHA API timed out",
    });
  }

  // Helper to check if storeId and storeName belong to the current user
  private async checkStoreIdAndStoreName(
    userId: string,
    { storeId, storeName }: { storeId: string; storeName: string }
  ): Promise<boolean> {
    const user = await UserModel.getById<UserPublic>(userId);

    // Since id and name are Store ID and Store Name respectively, they should match exactly to storeId and storeName
    const isValid = user?.id === storeId && user?.name === storeName;

    return isValid;
  }

  async createSession(
    userId: string,
    options: CreateSessionOptions = {
      name: `sess-wani-${randomBytes(16).toHex()}`,
      config: this.sessionDefaultConfig,
    }
  ) {
    const { name, config } = options;

    // Check whether the storeId and storeName is belong to the current user
    // to prevent session hijacking
    const { storeId, storeName } = config?.metadata ?? {};
    if (storeId && storeName) {
      const isValid = await this.checkStoreIdAndStoreName(userId, {
        storeId,
        storeName,
      });
      if (!isValid) {
        throw new ForbiddenError(
          "Store ID or Store Name do not belong to the current user"
        );
      }
    }

    try {
      const session = await this.apiInstance.post<CreateSessionResponse>(
        "/sessions",
        {
          name,
          config: { ...this.sessionDefaultConfig, ...config },
          start: true,
        } // kalo config nya dikasih, apa yang ada di config bakal nge override yang ada di default config
      );

      logger.info(`Creating session ${name}`);

      return session.data;
    } catch (err) {
      if (isAxiosError(err)) {
        throw new InternalServerError("Failed to create session", err);
      }

      throw new InternalServerError(
        "Unexpected error when creating session",
        err
      );
    }
  }

  async getSessionsByName(name: string, storeId: string) {
    try {
      const sessions =
        await this.apiInstance.get<GetSessionResponse[]>(`/sessions`);

      const filteredSessions = sessions.data.filter(
        (session) =>
          session.name === name && session.config.metadata?.storeId === storeId
      );

      return filteredSessions;
    } catch (err) {
      if (isAxiosError(err)) {
        throw new InternalServerError("Failed to get session by name", err);
      }
      throw new InternalServerError(
        "Unexpected error when getting session by name",
        err
      );
    }
  }

  async getAllSessionsByStoreId(userId: string, storeId: string) {
    if (userId !== storeId) {
      throw new ForbiddenError("Store ID does not belong to the current user");
    }

    try {
      const sessions =
        await this.apiInstance.get<GetSessionResponse[]>(`/sessions`); // Get all sessions first and then filter by storeId

      const filteredSessions = sessions.data.filter(
        (session) => session.config.metadata?.storeId === storeId
      );
      return filteredSessions;
    } catch (err) {
      if (isAxiosError(err)) {
        throw new InternalServerError("Failed to get sessions", err);
      }
      throw new InternalServerError(
        "Unexpected error when getting sessions",
        err
      );
    }
  }
}

const wahaService = new WahaService();

export default wahaService;
