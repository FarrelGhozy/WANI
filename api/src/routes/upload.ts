import { Router } from "express"
import * as uploadController from "@/src/controllers/upload"
import { requireJwt } from "@/src/middleware/jwt"

const router = Router()

router.post("/", requireJwt, uploadController.upload.single("file"), uploadController.uploadFile)

export default router
