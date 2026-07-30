import { z } from "zod";

export const createSessionSchema = z.object({
  storeId: z.uuid({
    version: "v4",
    error: "Store ID is Required",
  }),
  storeName: z
    .string({
      error: "Store Name is Required",
    })
    .min(6),
});

export const getSessionsByStoreIdSchema = z.object({
  uuid: z.uuid({
    version: "v4",
    error: "Store ID is Required",
  }),
});

export const getSessionsByStoreIdQuerySchema = z.object({
  status: z
    .enum([
      "STOPPED",
      "STARTING",
      "SCAN_QR_CODE",
      "PASSKEY_REQUIRED",
      "PASSKEY_CONFIRMATION_REQUIRED",
      "WORKING",
      "FAILED",
    ])
    .optional(),
});

export const getSessionByNameQuerySchema = z.object({
  name: z
    .string({
      error: "Session Name is Required",
    })
    .regex(/^sess-wani-[a-f0-9]{32}/), // example: sess-wani-{16 bytes of hex / 32 characters consisting of hex digits (0-9, a-f)}
});
