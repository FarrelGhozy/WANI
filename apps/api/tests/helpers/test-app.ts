import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../src/middleware/error-handler.js';
import { healthRouter } from '../../src/routes/health.routes.js';
import { authRouter } from '../../src/routes/auth.routes.js';
import { merchantsRouter } from '../../src/routes/merchants.routes.js';
import { productsRouter } from '../../src/routes/products.routes.js';
import { customersRouter } from '../../src/routes/customers.routes.js';
import { ordersRouter } from '../../src/routes/orders.routes.js';
import { conversationsRouter } from '../../src/routes/conversations.routes.js';
import { categoriesRouter } from '../../src/routes/categories.routes.js';
import { webStoreRouter } from '../../src/routes/web-store.routes.js';
import { dashboardRouter } from '../../src/routes/dashboard.routes.js';
import { waSessionRouter } from '../../src/routes/wa-session.routes.js';
import { aiAgentRouter } from '../../src/routes/ai-agent.routes.js';
import { settingsRouter } from '../../src/routes/settings.routes.js';

export function createTestApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: '*' }));
  app.use(rateLimit({
    windowMs: 60_000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests' },
  }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

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

  app.use(errorHandler);

  return app;
}
