import * as Sentry from "@sentry/node";
import { config } from "./config/index.js";

Sentry.init({
  dsn: config.sentryDsn,
  environment: config.nodeEnv,
  tracesSampleRate: 0.1,
});

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import {
  healthRouter, authRouter, merchantsRouter,
  productsRouter, customersRouter, ordersRouter,
  conversationsRouter, categoriesRouter,
  webStoreRouter, dashboardRouter,
  waSessionRouter, aiAgentRouter, settingsRouter,
} from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(rateLimit({
  windowMs: 60_000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: "Too many requests" },
}));

app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/merchants", merchantsRouter);
app.use("/api/products", productsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api", webStoreRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api", waSessionRouter);
app.use("/api/ai-agent", aiAgentRouter);
app.use("/api/settings", settingsRouter);

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, "🚀 WANI server started");
});

export default app;
