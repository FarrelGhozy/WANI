import { Router } from "express"
import * as aiConfigController from "@/src/controllers/ai-config"
import { requireAuth } from "@/src/middleware/auth"
import { validate } from "@/src/middleware/validate"
import { upsertAiConfigSchema } from "@/src/schemas/ai-config"

const router = Router()

router.get("/", aiConfigController.getAiConfig)
router.put("/", requireAuth, validate({ body: upsertAiConfigSchema }), aiConfigController.upsertAiConfig)

export default router
