import { Router } from "express";
import * as logController from "@/controllers/log";
import { requireJwt } from "@/middleware/jwt";

const router = Router();

router.get("/", requireJwt, logController.getUsage);

export default router;
