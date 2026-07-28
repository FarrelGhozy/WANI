import { Router } from "express"
import * as chatController from "@/controllers/chat"
import { requireAuth } from "@/middleware/auth"
import { validate } from "@/middleware/validate"
import { chatRequestSchema } from "@/schemas/chat"

const router = Router()

router.post("/", requireAuth, validate({ body: chatRequestSchema }), chatController.postChat)

export default router
