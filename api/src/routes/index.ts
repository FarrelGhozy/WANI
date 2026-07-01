import { Router } from "express"
import qrRoutes from "@/src/routes/qr"
import chatRoutes from "@/src/routes/chat"
import storeRoutes from "@/src/routes/store"
import storePaymentRoutes from "@/src/routes/store-payment"
import aiConfigRoutes from "@/src/routes/ai-config"
import productRoutes, { categoryRouter } from "@/src/routes/product"
import orderRoutes from "@/src/routes/order"
import customerRoutes, { conversationRouter } from "@/src/routes/customer"
import dashboardRoutes from "@/src/routes/dashboard"
import logRoutes from "@/src/routes/log"
import usageRoutes from "@/src/routes/usage"
import authRoutes from "@/src/routes/auth"
import websiteRoutes from "@/src/routes/website"
import uploadRoutes from "@/src/routes/upload"
import outgoingRoutes from "@/src/routes/outgoing"
import monitoringRoutes from "@/src/routes/monitoring"
import debugRoutes from "@/src/routes/debug"

const router = Router()
router.use("/qr", qrRoutes)
router.use("/chat", chatRoutes)
router.use("/store", storeRoutes)
router.use("/store/payment-methods", storePaymentRoutes)
router.use("/ai-config", aiConfigRoutes)
router.use("/products/categories", categoryRouter)
router.use("/products", productRoutes)
router.use("/orders", orderRoutes)
router.use("/customers", customerRoutes)
router.use("/conversations", conversationRouter)
router.use("/dashboard", dashboardRoutes)
router.use("/logs", logRoutes)
router.use("/usage", usageRoutes)
router.use("/auth", authRoutes)
router.use("/website", websiteRoutes)
router.use("/upload", uploadRoutes)
router.use("/outgoing", outgoingRoutes)
router.use("/", monitoringRoutes)

// Dev-only: pipeline traces, circuit breaker status/reset
if (process.env.NODE_ENV !== "production") {
  router.use("/debug", debugRoutes)
}

export default router
