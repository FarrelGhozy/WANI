import { z } from "zod";
import { API_KEY_SCOPES } from "@/models/api-key";

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1),
  expiresInDays: z.number().int().min(1).max(365).default(90),
});
