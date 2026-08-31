import { Router } from "express";
import * as dashboardController from "@/controllers/dashboard";
import { requireJwt } from "@/middleware/jwt";

const router = Router();

router.get("/stats", requireJwt, dashboardController.getStats);

export default router;
