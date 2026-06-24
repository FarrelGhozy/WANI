import { Router } from "express"
import * as logController from "@/src/controllers/log"
import { validate } from "@/src/middleware/validate"
import { logQuerySchema } from "@/src/schemas/log"

const router = Router()

router.get("/", validate({ query: logQuerySchema }), logController.listLogs)

export default router
