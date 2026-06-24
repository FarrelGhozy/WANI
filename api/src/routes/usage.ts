import { Router } from "express"
import * as logController from "@/src/controllers/log"

const router = Router()

router.get("/", logController.getUsage)

export default router
