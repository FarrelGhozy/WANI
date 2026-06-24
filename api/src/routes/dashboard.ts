import { Router } from "express"
import * as dashboardController from "@/src/controllers/dashboard"

const router = Router()

router.get("/stats", dashboardController.getStats)

export default router
