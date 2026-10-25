import { Router } from "express";
import * as SessionsController from "@/controllers/sessions";
import { requireServiceAuth } from "@/middleware/auth";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import {
  createSessionSchema,
  sessionQuerySchema,
  pairingSchema,
} from "@/schemas/sessions";

const router = Router();

router.get(
  "/",
  requireJwt,
  validate({ query: sessionQuerySchema }),
  SessionsController.getSession
);

router.post(
  "/",
  requireJwt,
  validate({ body: createSessionSchema }),
  SessionsController.createSession
);

router.post(
  "/sync",
  requireJwt,
  SessionsController.syncSession
);

router.post(
  "/reset",
  requireJwt,
  SessionsController.resetSession
);

router.post(
  "/pairing",
  requireJwt,
  validate({ body: pairingSchema }),
  SessionsController.requestPairing
);

router.post(
  "/refresh-pairing",
  requireJwt,
  SessionsController.refreshPairing
);

router.delete("/", requireJwt, SessionsController.deleteSession);

// Incoming WhatsApp message webhook (WAHA -> API)
// Supports both WAHA webhook shape { session, payload } and legacy { phone, text }
// Service API keys are owner-bound and need the sessions:messages scope.
router.post(
  "/messages",
  requireServiceAuth("sessions:messages"),
  SessionsController.postMessage
);

export default router;
