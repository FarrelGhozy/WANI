import { Router } from "express"
import * as outgoingController from "@/controllers/outgoing"
import { requireAuth } from "@/middleware/auth"

const router = Router()

router.get("/", requireAuth, outgoingController.listOutgoing)
router.patch("/:id/delivered", requireAuth, outgoingController.markDelivered)

export default router
