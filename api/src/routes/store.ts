import { Router } from "express";
import * as storeController from "@/controllers/store";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import { upsertStoreSchema } from "@/schemas/store";

const router = Router();

router.get("/", storeController.getStore);
router.put(
  "/",
  requireJwt,
  validate({ body: upsertStoreSchema }),
  storeController.upsertStore
);

export default router;
