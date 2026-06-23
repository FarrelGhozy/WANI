import { Router } from "express"
import * as debugController from "@/src/controllers/debug"
import { validate } from "@/src/middleware/validate"
import { getTracesQuerySchema, getTraceDetailParamsSchema } from "@/src/schemas/debug"

const router = Router()

router.get("/traces", validate({ query: getTracesQuerySchema }), debugController.getRecentTraces)
router.get("/traces/:id", validate({ params: getTraceDetailParamsSchema }), debugController.getTraceDetail)
router.delete("/traces", debugController.deleteTraces)
router.get("/status", debugController.getStatus)
router.post("/circuit/reset", debugController.postResetCircuit)

export default router
