import { Router } from "express";
import * as logController from "@/controllers/log";
import { validate } from "@/middleware/validate";
import { logQuerySchema } from "@/schemas/log";

const router = Router();

router.get("/", validate({ query: logQuerySchema }), logController.listLogs);

export default router;
