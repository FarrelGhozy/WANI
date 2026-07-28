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
import { InternalServerError } from "@/utils/errors";

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

  async createSession(
    options: CreateSessionOptions = {
      name: `sess-wani-${randomBytes(16).toHex()}`,
      config: this.sessionDefaultConfig,
    }
  ) {
    const { name, config } = options;

    try {
      const session = await this.apiInstance.post<CreateSessionResponse>(
        "/sessions",
        { ...this.sessionDefaultConfig, ...config } // kalo config nya dikasih, apa yang ada di config bakal nge override yang ada di default config
      );

      logger.info(`Creating session ${name}`);

      return session.data;
    } catch (err) {
      if (isAxiosError(err)) {
        throw new InternalServerError(
          "Failed to create session",
          err.response?.data
        );
      }

      throw new InternalServerError(
        "Unexpected error when creating session",
        err
      );
    }
  }

  async getAllSessions() {
    try {
      const sessions =
        await this.apiInstance.get<GetSessionResponse[]>("/sessions");
      return sessions.data;
    } catch (err) {
      if (isAxiosError(err)) {
        throw new InternalServerError(
          "Failed to get all sessions",
          err.response?.data
        );
      }

      throw new InternalServerError(
        "Unexpected error when getting all sessions",
        err
      );
    }
  }
}

const wahaService = new WahaService();

export default wahaService;
