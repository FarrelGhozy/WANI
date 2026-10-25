interface SessionWebhookConfig {
  url: string; // Webhook URL
  // List of events to subscribe to.
  // See all available events in https://waha.devlike.pro/docs/how-to/events/#events
  events: string[];
  hmac?: {
    key: string; // HMAC key for verifying webhook payloads
  };
  customHeaders?: { name: string; value: string }[]; // Custom headers to include in the webhook request
  retries?: {
    policy: string;
    delaySeconds: number;
    attempts: number;
  };
}

export interface SessionConfig {
  // Define the properties for the session configuration
  debug?: boolean;
  noweb?: {
    store: {
      enabled: boolean;
      fullSync: boolean;
    };
  };
  webjs?: {
    tagsEventsOn: boolean;
  };
  client?: {
    deviceName: string; // Name of the device in Linked Devices
    browserName: "Chrome" | "Safari" | "Firefox"; // Name of the browser in Linked Devices (only providing options for the most common browsers)
  };
  metadata?: Record<string, string> & {
    storeId: string; // Buat pembeda tiap session dari tiap toko
    storeName: string; // Nama tokonya
  };
  ignore?: {
    status: boolean;
    groups: boolean;
    channels: boolean;
  };
  webhooks?: SessionWebhookConfig[]; // Array of webhook configurations
  proxy?: {
    server: string;
    username: string;
    password: string;
  };
}

export interface CreateSessionResponse {
  name: string;
  status:
    | "STOPPED"
    | "STARTING"
    | "SCAN_QR_CODE"
    | "PASSKEY_REQUIRED"
    | "PASSKEY_CONFIRMATION_REQUIRED"
    | "WORKING"
    | "FAILED";
  engine: {
    engine: "WEBJS" | "GOWS" | "NOWEB";
  };
  config: SessionConfig;
  me: null;
}

export interface GetSessionResponse {
  name: string;
  status:
    | "STOPPED"
    | "STARTING"
    | "SCAN_QR_CODE"
    | "PASSKEY_REQUIRED"
    | "PASSKEY_CONFIRMATION_REQUIRED"
    | "WORKING"
    | "FAILED";
  config: SessionConfig;
  engine: {
    engine: "WEBJS" | "GOWS" | "NOWEB";
  };
  me: {
    id: string;
    pushName: string;
  } | null;
}

export interface CreateSessionOptions {
  name?: string;
  config?: SessionConfig;
}
