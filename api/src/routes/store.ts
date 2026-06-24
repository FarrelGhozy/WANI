import { Router } from "express"
import * as storeController from "@/src/controllers/store"
import { requireJwt } from "@/src/middleware/jwt"
import { validate } from "@/src/middleware/validate"
import { upsertStoreSchema } from "@/src/schemas/store"

const router = Router()

router.get("/", storeController.getStore)
router.put("/", requireJwt, validate({ body: upsertStoreSchema }), storeController.upsertStore)

export default router
