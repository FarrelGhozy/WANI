import { Router } from "express"
import * as orderController from "@/src/controllers/order"
import { requireAuth } from "@/src/middleware/auth"
import { validate } from "@/src/middleware/validate"
import {
  orderQuerySchema,
  updateOrderStatusSchema,
  updateOrderNotesSchema,
  updateOrderPaymentSchema,
} from "@/src/schemas/order"

const router = Router()

router.get("/", validate({ query: orderQuerySchema }), orderController.listOrders)
router.get("/:id", orderController.getOrder)
router.put("/:id/status", requireAuth, validate({ body: updateOrderStatusSchema }), orderController.updateOrderStatus)
router.put("/:id/notes", requireAuth, validate({ body: updateOrderNotesSchema }), orderController.updateOrderNotes)
router.put("/:id/payment", requireAuth, validate({ body: updateOrderPaymentSchema }), orderController.updateOrderPayment)

export default router
