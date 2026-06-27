import { Router } from "express"
import * as qrController from "@/src/controllers/qr"
import { requireAuth } from "@/src/middleware/auth"
import { requireJwt } from "@/src/middleware/jwt"
import { validate } from "@/src/middleware/validate"
import { upsertQrSchema } from "@/src/schemas/wa-session"

const router = Router()

router.get("/", qrController.getQr)
router.get("/status", qrController.getStatus)
router.post("/", requireAuth, validate({ body: upsertQrSchema }), qrController.upsertQr)
router.delete("/", requireAuth, qrController.clearQr)
router.post("/reset", requireJwt, qrController.resetQr)

export default router
