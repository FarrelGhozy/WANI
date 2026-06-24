import { Router } from "express"
import * as orderController from "@/src/controllers/order"
import { requireJwt } from "@/src/middleware/jwt"
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
router.put("/:id/status", requireJwt, validate({ body: updateOrderStatusSchema }), orderController.updateOrderStatus)
router.put("/:id/notes", requireJwt, validate({ body: updateOrderNotesSchema }), orderController.updateOrderNotes)
router.put("/:id/payment", requireJwt, validate({ body: updateOrderPaymentSchema }), orderController.updateOrderPayment)

export default router
