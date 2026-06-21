import { Router } from "express"
import qrRoutes from "@/src/routes/qr"

const router = Router()
router.use("/qr", qrRoutes)

export default router
