import { Router } from "express"
import * as outgoingController from "@/src/controllers/outgoing"
import { requireAuth } from "@/src/middleware/auth"

const router = Router()

router.get("/", requireAuth, outgoingController.listOutgoing)
router.patch("/:id/delivered", requireAuth, outgoingController.markDelivered)

export default router
