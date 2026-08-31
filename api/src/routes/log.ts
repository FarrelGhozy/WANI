import { Router } from "express";
import * as logController from "@/controllers/log";
import { validate } from "@/middleware/validate";
import { logQuerySchema } from "@/schemas/log";
import { requireJwt } from "@/middleware/jwt";

const router = Router();

router.get(
  "/",
  requireJwt,
  validate({ query: logQuerySchema }),
  logController.listLogs
);

export default router;
