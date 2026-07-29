import { Router } from "express";
import * as SessionsController from "@/controllers/sessions";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import { createSessionSchema, getSessionsByIdSchema } from "@/schemas/sessions";

const router = Router();

router.get(
  "/:uuid",
  requireJwt,
  validate({ params: getSessionsByIdSchema }),
  SessionsController.getSessionsByStoreId
);

router.post(
  "/",
  requireJwt,
  validate({ body: createSessionSchema }),
  SessionsController.createSession
);

export default router;
