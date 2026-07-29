import { Router } from "express"
import * as dashboardController from "@/controllers/dashboard"

const router = Router()

router.get("/stats", dashboardController.getStats)

export default router
