import { Router } from "express";
import * as SessionsController from "@/controllers/sessions";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import { createSessionSchema } from "@/schemas/sessions";

const router = Router();

router.get("/", requireJwt, SessionsController.getAllSessions);
router.post(
  "/",
  requireJwt,
  validate({ body: createSessionSchema }),
  SessionsController.createSession
);

export default router;
