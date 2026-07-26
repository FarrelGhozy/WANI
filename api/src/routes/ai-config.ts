import { Router } from "express";
import * as aiConfigController from "@/controllers/ai-config";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import { upsertAiConfigSchema } from "@/schemas/ai-config";

const router = Router();

router.get("/", requireJwt, aiConfigController.getAiConfig);
router.put(
  "/",
  requireJwt,
  validate({ body: upsertAiConfigSchema }),
  aiConfigController.upsertAiConfig
);

export default router;
