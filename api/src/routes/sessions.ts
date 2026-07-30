import { Router } from "express";
import * as SessionsController from "@/controllers/sessions";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import {
  createSessionSchema,
  getSessionByNameQuerySchema,
  getSessionsByStoreIdQuerySchema,
  getSessionsByStoreIdSchema,
} from "@/schemas/sessions";

const router = Router();

router.get(
  "/",
  requireJwt,
  validate({ query: getSessionByNameQuerySchema }),
  SessionsController.getSessionsByName
);

router.get(
  "/:uuid",
  requireJwt,
  validate({
    query: getSessionsByStoreIdQuerySchema,
    params: getSessionsByStoreIdSchema,
  }),
  SessionsController.getSessionsByStoreId
);

router.post(
  "/",
  requireJwt,
  validate({ body: createSessionSchema }),
  SessionsController.createSession
);

export default router;
