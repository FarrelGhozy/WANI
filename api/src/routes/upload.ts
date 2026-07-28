import { Router } from "express"
import * as uploadController from "@/controllers/upload"
import { requireJwt } from "@/middleware/jwt"

const router = Router()

router.post("/", requireJwt, uploadController.upload.single("file"), uploadController.uploadFile)

export default router
