import { Router } from "express"
import * as debugController from "@/src/controllers/debug"

const router = Router()

router.get("/traces", debugController.getRecentTraces)
router.get("/traces/:id", debugController.getTraceDetail)
router.delete("/traces", debugController.deleteTraces)
router.get("/status", debugController.getStatus)
router.post("/circuit/reset", debugController.postResetCircuit)

export default router
