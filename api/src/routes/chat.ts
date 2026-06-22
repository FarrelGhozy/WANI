import { Router } from "express"
import * as chatController from "@/src/controllers/chat"
import { requireAuth } from "@/src/middleware/auth"
import { validate } from "@/src/middleware/validate"
import { chatRequestSchema } from "@/src/schemas/chat"

const router = Router()

router.post("/", requireAuth, validate({ body: chatRequestSchema }), chatController.postChat)

export default router
