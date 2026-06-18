import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { merchantsRouter } from './routes/merchants.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { customersRouter } from './routes/customers.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { conversationsRouter } from './routes/conversations.routes.js';
import { categoriesRouter } from './routes/categories.routes.js';
import { webStoreRouter } from './routes/web-store.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { waSessionRouter } from './routes/wa-session.routes.js';
import { aiAgentRouter } from './routes/ai-agent.routes.js';
import { settingsRouter } from './routes/settings.routes.js';

const app = express();

// ─── Security ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests' },
}));

// ─── Body Parsing ─────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/merchants', merchantsRouter);
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api', webStoreRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', waSessionRouter);
app.use('/api/ai-agent', aiAgentRouter);
app.use('/api/settings', settingsRouter);

// ─── Global Error Handler ─────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────
app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, '🚀 WANI server started');
});

export default app;
