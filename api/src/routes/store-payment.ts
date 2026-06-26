import { Router } from "express"
import * as storePaymentController from "@/src/controllers/store-payment"
import { requireJwt } from "@/src/middleware/jwt"
import { validate } from "@/src/middleware/validate"
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from "@/src/schemas/store-payment"

const router = Router()

router.get("/", storePaymentController.listPaymentMethods)
router.post("/", requireJwt, validate({ body: createPaymentMethodSchema }), storePaymentController.createPaymentMethod)
router.put("/:id", requireJwt, validate({ body: updatePaymentMethodSchema }), storePaymentController.updatePaymentMethod)
router.delete("/:id", requireJwt, storePaymentController.deletePaymentMethod)

export default router
