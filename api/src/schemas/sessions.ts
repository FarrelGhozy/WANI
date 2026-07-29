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

export const getSessionsByIdSchema = z.object({
  uuid: z.uuid({
    version: "v4",
    error: "Store ID is Required",
  }),
});
