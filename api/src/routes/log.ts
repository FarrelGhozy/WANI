import { Router } from "express"
import * as logController from "@/controllers/log"
import { requireJwt } from "@/middleware/jwt"
import { validate } from "@/middleware/validate"
import { logQuerySchema } from "@/schemas/log"

const router = Router()

router.get("/", requireJwt, validate({ query: logQuerySchema }), logController.listLogs)

export default router
