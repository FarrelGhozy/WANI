import { Router } from "express";
import qrRoutes from "@/routes/qr";
import chatRoutes from "@/routes/chat";
import storeRoutes from "@/routes/store";
import storePaymentRoutes from "@/routes/store-payment";
import aiConfigRoutes from "@/routes/ai-config";
import productRoutes, { categoryRouter } from "@/routes/product";
import orderRoutes from "@/routes/order";
import customerRoutes, { conversationRouter } from "@/routes/customer";
import dashboardRoutes from "@/routes/dashboard";
import logRoutes from "@/routes/log";
import usageRoutes from "@/routes/usage";
import authRoutes from "@/routes/auth";
import websiteRoutes from "@/routes/website";
import uploadRoutes from "@/routes/upload";
import outgoingRoutes from "@/routes/outgoing";
import monitoringRoutes from "@/routes/monitoring";
import debugRoutes from "@/routes/debug";

const router = Router();
router.use("/qr", qrRoutes);
router.use("/chat", chatRoutes);
router.use("/store", storeRoutes);
router.use("/store/payment-methods", storePaymentRoutes);
router.use("/ai-config", aiConfigRoutes);
router.use("/products/categories", categoryRouter);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/customers", customerRoutes);
router.use("/conversations", conversationRouter);
router.use("/dashboard", dashboardRoutes);
router.use("/logs", logRoutes);
router.use("/usage", usageRoutes);
router.use("/auth", authRoutes);
router.use("/website", websiteRoutes);
router.use("/upload", uploadRoutes);
router.use("/outgoing", outgoingRoutes);
router.use("/", monitoringRoutes);

// Dev-only: pipeline traces, circuit breaker status/reset
if (process.env.NODE_ENV !== "production") {
  router.use("/debug", debugRoutes);
}

export default router;
