import { Router } from "express";
import * as apiKeyController from "@/controllers/api-key";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import { createApiKeySchema } from "@/schemas/api-key";

const router = Router();

router.get("/", requireJwt, apiKeyController.listApiKeys);
router.post(
  "/",
  requireJwt,
  validate({ body: createApiKeySchema }),
  apiKeyController.createApiKey
);
router.delete("/:id", requireJwt, apiKeyController.revokeApiKey);

export default router;
