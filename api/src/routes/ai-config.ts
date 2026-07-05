import { Router } from "express"
import * as aiConfigController from "@/src/controllers/ai-config"
import { requireJwt } from "@/src/middleware/jwt"
import { validate } from "@/src/middleware/validate"
import { upsertAiConfigSchema } from "@/src/schemas/ai-config"

const router = Router()

router.get("/", requireJwt, aiConfigController.getAiConfig)
router.put("/", requireJwt, validate({ body: upsertAiConfigSchema }), aiConfigController.upsertAiConfig)

export default router
