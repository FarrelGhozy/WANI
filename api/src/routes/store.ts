import { Router } from "express"
import * as storeController from "@/src/controllers/store"
import { requireAuth } from "@/src/middleware/auth"
import { validate } from "@/src/middleware/validate"
import { upsertStoreSchema } from "@/src/schemas/store"

const router = Router()

router.get("/", storeController.getStore)
router.put("/", requireAuth, validate({ body: upsertStoreSchema }), storeController.upsertStore)

export default router
