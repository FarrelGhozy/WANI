import { Router } from "express"
import * as monitoringController from "@/src/controllers/monitoring"

const router = Router()

router.get("/health", monitoringController.getHealth)
router.get("/metrics", monitoringController.getMetricsHandler)

export default router
