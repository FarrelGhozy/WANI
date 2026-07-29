import { Router } from "express"
import * as customerController from "@/controllers/customer"
import { requireJwt } from "@/middleware/jwt"
import { validate } from "@/middleware/validate"
import {
  customerQuerySchema,
  updateCustomerSchema,
  updateConversationStatusSchema,
  sendMessageSchema,
} from "@/schemas/customer"

const router = Router()

router.get("/", validate({ query: customerQuerySchema }), customerController.listCustomers)
router.get("/:id", customerController.getCustomer)
router.put("/:id", requireJwt, validate({ body: updateCustomerSchema }), customerController.updateCustomer)

export default router

export const conversationRouter = Router()

conversationRouter.get("/:id", customerController.getConversation)
conversationRouter.put(
  "/:id/status",
  requireJwt,
  validate({ body: updateConversationStatusSchema }),
  customerController.updateConversationStatus,
)
conversationRouter.post(
  "/:id/messages",
  requireJwt,
  validate({ body: sendMessageSchema }),
  customerController.sendMessage,
)
