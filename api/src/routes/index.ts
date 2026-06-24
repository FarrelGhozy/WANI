import { Router } from "express"
import qrRoutes from "@/src/routes/qr"
import chatRoutes from "@/src/routes/chat"
import storeRoutes from "@/src/routes/store"
import aiConfigRoutes from "@/src/routes/ai-config"
import productRoutes, { categoryRouter } from "@/src/routes/product"
import orderRoutes from "@/src/routes/order"
import customerRoutes, { conversationRouter } from "@/src/routes/customer"
import dashboardRoutes from "@/src/routes/dashboard"
import logRoutes from "@/src/routes/log"
import usageRoutes from "@/src/routes/usage"
import debugRoutes from "@/src/routes/debug"

const router = Router()
router.use("/qr", qrRoutes)
router.use("/chat", chatRoutes)
router.use("/store", storeRoutes)
router.use("/ai-config", aiConfigRoutes)
router.use("/products/categories", categoryRouter)
router.use("/products", productRoutes)
router.use("/orders", orderRoutes)
router.use("/customers", customerRoutes)
router.use("/conversations", conversationRouter)
router.use("/dashboard", dashboardRoutes)
router.use("/logs", logRoutes)
router.use("/usage", usageRoutes)

// Dev-only: pipeline traces, circuit breaker status/reset
if (process.env.NODE_ENV !== "production") {
  router.use("/debug", debugRoutes)
}

export default router
