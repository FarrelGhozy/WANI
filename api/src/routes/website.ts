import { Router } from "express"
import * as websiteController from "@/src/controllers/website"
import { requireJwt } from "@/src/middleware/jwt"
import { validate } from "@/src/middleware/validate"
import { updateWebsiteSchema, generateWebsiteSchema } from "@/src/schemas/website"

const router = Router()

router.get("/", websiteController.getWebsiteConfig)
router.put("/", requireJwt, validate({ body: updateWebsiteSchema }), websiteController.updateWebsiteConfig)
router.post("/generate", requireJwt, validate({ body: generateWebsiteSchema }), websiteController.generateWebsite)
router.get("/download", requireJwt, websiteController.downloadWebsite)
router.post("/publish", requireJwt, websiteController.publishWebsite)

export default router
