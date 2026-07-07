import { Router } from "express"
import * as qrController from "@/src/controllers/qr"
import { requireAuth } from "@/src/middleware/auth"
import { requireJwt } from "@/src/middleware/jwt"
import { validate } from "@/src/middleware/validate"
import { upsertQrSchema, pairingSchema } from "@/src/schemas/wa-session"

const router = Router()

router.get("/", requireJwt, qrController.getQr)
router.get("/status", requireJwt, qrController.getStatus)
router.post("/reset", requireJwt, qrController.resetQr)
router.post("/pairing", requireJwt, validate({ body: pairingSchema }), qrController.requestPairing)
router.post("/refresh-pairing", requireJwt, qrController.refreshPairing)

router.post("/bot", requireAuth, validate({ body: upsertQrSchema }), qrController.upsertQr)
router.delete("/bot/:ownerId", requireAuth, qrController.clearBotQr)
router.get("/active-tenants", requireAuth, qrController.getActiveTenants)

export default router
