import { Router } from "express"
import * as customerController from "@/src/controllers/customer"
import { requireAuth } from "@/src/middleware/auth"
import { validate } from "@/src/middleware/validate"
import {
  customerQuerySchema,
  updateCustomerSchema,
  updateConversationStatusSchema,
  sendMessageSchema,
} from "@/src/schemas/customer"

const router = Router()

router.get("/", validate({ query: customerQuerySchema }), customerController.listCustomers)
router.get("/:id", customerController.getCustomer)
router.put("/:id", requireAuth, validate({ body: updateCustomerSchema }), customerController.updateCustomer)

export default router

export const conversationRouter = Router()

conversationRouter.get("/:id", customerController.getConversation)
conversationRouter.put(
  "/:id/status",
  requireAuth,
  validate({ body: updateConversationStatusSchema }),
  customerController.updateConversationStatus,
)
conversationRouter.post(
  "/:id/messages",
  requireAuth,
  validate({ body: sendMessageSchema }),
  customerController.sendMessage,
)
