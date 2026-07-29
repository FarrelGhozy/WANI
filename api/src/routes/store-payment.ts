import { Router } from "express"
import * as storePaymentController from "@/controllers/store-payment"
import { requireJwt } from "@/middleware/jwt"
import { validate } from "@/middleware/validate"
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from "@/schemas/store-payment"

const router = Router()

router.get("/", storePaymentController.listPaymentMethods)
router.post("/", requireJwt, validate({ body: createPaymentMethodSchema }), storePaymentController.createPaymentMethod)
router.put("/:id", requireJwt, validate({ body: updatePaymentMethodSchema }), storePaymentController.updatePaymentMethod)
router.delete("/:id", requireJwt, storePaymentController.deletePaymentMethod)

export default router
