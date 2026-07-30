import { z } from "zod";

export const createSessionSchema = z.object({
  storeName: z.string({ error: "Store Name is Required" }).min(1),
});

export const sessionQuerySchema = z.object({
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

export const pairingSchema = z.object({
  phone: z.string().regex(/^\d{10,15}$/, "Nomor telepon tidak valid"),
});
