import { Router } from "express"
import qrRoutes from "@/src/routes/qr"
import chatRoutes from "@/src/routes/chat"
import storeRoutes from "@/src/routes/store"
import aiConfigRoutes from "@/src/routes/ai-config"
import productRoutes, { categoryRouter } from "@/src/routes/product"
import debugRoutes from "@/src/routes/debug"

const router = Router()
router.use("/qr", qrRoutes)
router.use("/chat", chatRoutes)
router.use("/store", storeRoutes)
router.use("/ai-config", aiConfigRoutes)
router.use("/products/categories", categoryRouter)
router.use("/products", productRoutes)

// Dev-only: pipeline traces, circuit breaker status/reset
if (process.env.NODE_ENV !== "production") {
  router.use("/debug", debugRoutes)
}

export default router
