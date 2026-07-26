import { Router } from "express";
import * as qrController from "@/controllers/qr";
import { requireAuth } from "@/middleware/auth";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import { upsertQrSchema, pairingSchema } from "@/schemas/wa-session";

const router = Router();

router.get("/", qrController.getQr);
router.get("/status", qrController.getStatus);
router.post(
  "/",
  requireAuth,
  validate({ body: upsertQrSchema }),
  qrController.upsertQr
);
router.delete("/", requireAuth, qrController.clearQr);
router.post("/reset", requireJwt, qrController.resetQr);
router.post(
  "/pairing",
  requireJwt,
  validate({ body: pairingSchema }),
  qrController.requestPairing
);
router.post("/refresh-pairing", requireJwt, qrController.refreshPairing);

export default router;
