import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ─── Prisma Mock ──────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  merchant: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  customer: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    upsert: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  order: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  orderItem: { findMany: vi.fn() },
  conversation: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  message: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
  },
  aIAgent: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  webStore: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  template: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  setting: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  category: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  activityLog: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  payment: { create: vi.fn() },
  waSession: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../../src/config/prisma.js', () => ({ prisma: mockPrisma }));
vi.mock('../../src/config/index.js', () => ({
  config: {
    nodeEnv: 'test',
    port: 0,
    logLevel: 'silent',
    database: { url: 'postgresql://test:test@localhost:5432/test' },
    ai: { openrouterApiKey: 'test-key', defaultModel: 't', fallbackModel: 't2', maxTokens: 2048, temperature: 0.7 },
    auth: { jwtSecret: 'test-jwt-secret-for-testing', jwtExpiresIn: '7d' },
    whatsapp: { phone: '62812' },
  },
}));
vi.mock('../../src/config/logger.js', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

const bcryptMock = vi.hoisted(() => ({
  hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
  compare: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: bcryptMock,
  ...bcryptMock,
}));

vi.mock('../../src/baileys/index.js', () => ({
  BaileysManager: {
    getInstance: vi.fn(() => ({
      state: 'disconnected',
      qr: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
  },
}));



// ─── Test App ─────────────────────────────────────────────

import { createTestApp } from '../helpers/test-app.js';

const app = createTestApp();

// ─── Helpers ──────────────────────────────────────────────

const TEST_SECRET = 'test-jwt-secret-for-testing';
const TEST_MERCHANT_ID = '00000000-0000-4000-a000-000000000001';
const TEST_PRODUCT_ID = '00000000-0000-4000-a000-000000000010';
const TEST_CUSTOMER_ID = '00000000-0000-4000-a000-000000000020';
const TEST_ORDER_ID = '00000000-0000-4000-a000-000000000030';
const TEST_CONV_ID = '00000000-0000-4000-a000-000000000040';

function merchantToken(overrides?: Partial<{ id: string; businessName: string; phone: string }>) {
  return jwt.sign(
    {
      type: 'merchant',
      id: overrides?.id ?? TEST_MERCHANT_ID,
      businessName: overrides?.businessName ?? 'Test Merchant',
      phone: overrides?.phone ?? '6281234567890',
    },
    TEST_SECRET,
    { expiresIn: '7d' },
  );
}

// ─── Tests ────────────────────────────────────────────────

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══ 1. Health & Auth ═════════════════════════════════

  describe('Health & Auth', () => {
    it('GET /health → 200 status ok', async () => {
      mockPrisma.merchant.findFirst = vi.fn().mockResolvedValue({ count: '1' });
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('POST /api/auth/register (valid) → 201', async () => {
      mockPrisma.merchant.findUnique = vi.fn().mockResolvedValue(null);
      mockPrisma.merchant.create = vi.fn().mockResolvedValue({
        id: TEST_MERCHANT_ID,
        businessName: 'Toko Baru',
        phone: '6281111111111',
        passwordHash: '$2a$12$xxx',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ businessName: 'Toko Baru', phone: '6281111111111', password: 'rahasia123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.merchant.businessName).toBe('Toko Baru');
      expect(res.body.data.token).toBeDefined();
    });

    it('POST /api/auth/register (duplicate phone) → 409', async () => {
      mockPrisma.merchant.findUnique = vi.fn().mockResolvedValue({
        id: TEST_MERCHANT_ID,
        businessName: 'Existing',
        phone: '6281234567890',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ businessName: 'Toko Baru', phone: '6281234567890', password: 'rahasia123' });

      expect(res.status).toBe(409);
    });

    it('POST /api/auth/login (valid) → 200', async () => {
      bcryptMock.compare.mockResolvedValue(true as never);

      mockPrisma.merchant.findUnique = vi.fn().mockResolvedValue({
        id: TEST_MERCHANT_ID,
        businessName: 'Test Merchant',
        phone: '6281234567890',
        passwordHash: '$2a$12$hashedpassword',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '6281234567890', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('POST /api/auth/login (wrong password) → 401', async () => {
      bcryptMock.compare.mockResolvedValue(false as never);

      mockPrisma.merchant.findUnique = vi.fn().mockResolvedValue({
        id: TEST_MERCHANT_ID,
        businessName: 'Test Merchant',
        phone: '6281234567890',
        passwordHash: '$2a$12$hashedpassword',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '6281234567890', password: 'salah' });

      expect(res.status).toBe(401);
    });

    it('GET /api/merchants/me (no auth) → 401', async () => {
      const res = await request(app).get('/api/merchants/me');
      expect(res.status).toBe(401);
    });
  });

  // ═══ 2. Merchant ═══════════════════════════════════════

  describe('Merchant', () => {
    it('GET /api/merchants/me (with auth) → 200', async () => {
      mockPrisma.merchant.findUnique = vi.fn().mockResolvedValue({
        id: TEST_MERCHANT_ID,
        businessName: 'Test Merchant',
        phone: '6281234567890',
        address: null,
        isActive: true,
      });

      const res = await request(app)
        .get('/api/merchants/me')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.businessName).toBe('Test Merchant');
    });

    it('PUT /api/merchants/me (valid) → 200', async () => {
      mockPrisma.merchant.findUnique = vi.fn().mockResolvedValue({
        id: TEST_MERCHANT_ID,
        businessName: 'Test Merchant',
        phone: '6281234567890',
        isActive: true,
      });
      mockPrisma.merchant.update = vi.fn().mockResolvedValue({
        id: TEST_MERCHANT_ID,
        businessName: 'Warung Baru',
        phone: '6281234567890',
        address: 'Jl. Baru No. 1',
      });

      const res = await request(app)
        .put('/api/merchants/me')
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ businessName: 'Warung Baru', address: 'Jl. Baru No. 1' });

      expect(res.status).toBe(200);
      expect(res.body.data.businessName).toBe('Warung Baru');
    });

    it('GET /api/merchants/me/stats → 200', async () => {
      mockPrisma.merchant.findUnique = vi.fn().mockResolvedValue({ id: TEST_MERCHANT_ID });
      mockPrisma.product.count = vi.fn().mockResolvedValue(5);
      mockPrisma.customer.count = vi.fn().mockResolvedValue(10);
      mockPrisma.order.count = vi.fn().mockResolvedValue(3);

      const res = await request(app)
        .get('/api/merchants/me/stats')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.productCount).toBe(5);
      expect(res.body.data.customerCount).toBe(10);
      expect(res.body.data.pendingOrderCount).toBe(3);
    });
  });

  // ═══ 3. Products ═══════════════════════════════════════

  describe('Products', () => {
    it('GET /api/products → 200 paginated list', async () => {
      mockPrisma.product.findMany = vi.fn().mockResolvedValue([
        { id: TEST_PRODUCT_ID, name: 'Sate Ayam', price: 15000, stock: 10, isAvailable: true, category: null },
      ]);
      mockPrisma.product.count = vi.fn().mockResolvedValue(1);

      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('POST /api/products (valid) → 201', async () => {
      mockPrisma.merchant.findUnique = vi.fn().mockResolvedValue({ id: TEST_MERCHANT_ID });
      mockPrisma.product.create = vi.fn().mockResolvedValue({
        id: TEST_PRODUCT_ID,
        name: 'Sate Ayam',
        price: 15000,
        stock: 10,
        isAvailable: true,
        category: null,
      });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ name: 'Sate Ayam', price: 15000, stock: 10 });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Sate Ayam');
    });

    it('POST /api/products (no name) → 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ price: 15000 });

      expect(res.status).toBe(400);
    });

    it('POST /api/products (negative price) → 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ name: 'Test', price: -1000 });

      expect(res.status).toBe(400);
    });

    it('PUT /api/products/:id (valid) → 200', async () => {
      mockPrisma.product.findUnique = vi.fn().mockResolvedValue({
        id: TEST_PRODUCT_ID,
        merchantId: TEST_MERCHANT_ID,
        name: 'Sate Ayam',
        price: 15000,
        stock: 10,
      });
      mockPrisma.product.update = vi.fn().mockResolvedValue({
        id: TEST_PRODUCT_ID,
        name: 'Sate Ayam Spesial',
        price: 20000,
        stock: 10,
        category: null,
      });

      const res = await request(app)
        .put(`/api/products/${TEST_PRODUCT_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ name: 'Sate Ayam Spesial', price: 20000 });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Sate Ayam Spesial');
    });

    it('PUT /api/products/:id (not found) → 200 with success false', async () => {
      mockPrisma.product.findUnique = vi.fn().mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/products/${TEST_PRODUCT_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ name: 'Nope' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });

    it('DELETE /api/products/:id → 200', async () => {
      mockPrisma.product.findUnique = vi.fn().mockResolvedValue({ id: TEST_PRODUCT_ID });
      mockPrisma.product.delete = vi.fn().mockResolvedValue({ id: TEST_PRODUCT_ID });

      const res = await request(app)
        .delete(`/api/products/${TEST_PRODUCT_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/products/:id (not found) → 200 with success false', async () => {
      mockPrisma.product.findUnique = vi.fn().mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/products/${TEST_PRODUCT_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });
  });

  // ═══ 4. Customers ══════════════════════════════════════

  describe('Customers', () => {
    it('GET /api/customers → 200 paginated list', async () => {
      mockPrisma.customer.findMany = vi.fn().mockResolvedValue([
        { id: TEST_CUSTOMER_ID, name: 'Budi', phone: '6281111111111', totalOrders: 2 },
      ]);
      mockPrisma.customer.count = vi.fn().mockResolvedValue(1);

      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /api/customers/:id → 200 detail', async () => {
      mockPrisma.customer.findUnique = vi.fn().mockResolvedValue({
        id: TEST_CUSTOMER_ID,
        name: 'Budi',
        phone: '6281111111111',
        totalOrders: 5,
        orders: [],
      });

      const res = await request(app)
        .get(`/api/customers/${TEST_CUSTOMER_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Budi');
    });

    it('GET /api/customers/:id (not found) → 200 with success false', async () => {
      mockPrisma.customer.findUnique = vi.fn().mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/customers/${TEST_CUSTOMER_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/customers?search=... → filtered results', async () => {
      mockPrisma.customer.findMany = vi.fn().mockResolvedValue([
        { id: TEST_CUSTOMER_ID, name: 'Budi', phone: '6281111111111', totalOrders: 2 },
      ]);
      mockPrisma.customer.count = vi.fn().mockResolvedValue(1);

      const res = await request(app)
        .get('/api/customers?search=Budi')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ═══ 5. Orders ═════════════════════════════════════════

  describe('Orders', () => {
    it('GET /api/orders → 200 paginated list', async () => {
      mockPrisma.order.findMany = vi.fn().mockResolvedValue([
        {
          id: TEST_ORDER_ID,
          status: 'PENDING',
          totalAmount: 50000,
          customer: { id: TEST_CUSTOMER_ID, name: 'Budi', phone: '62811' },
          items: [],
          payment: null,
        },
      ]);
      mockPrisma.order.count = vi.fn().mockResolvedValue(1);

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /api/orders?status=PENDING → filtered', async () => {
      mockPrisma.order.findMany = vi.fn().mockResolvedValue([]);
      mockPrisma.order.count = vi.fn().mockResolvedValue(0);

      const res = await request(app)
        .get('/api/orders?status=PENDING')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
    });

    it('GET /api/orders/:id → 200 detail', async () => {
      mockPrisma.order.findUnique = vi.fn().mockResolvedValue({
        id: TEST_ORDER_ID,
        status: 'PENDING',
        totalAmount: 50000,
        source: 'wa_chat',
        customer: { id: TEST_CUSTOMER_ID, name: 'Budi', phone: '62811' },
        merchant: { id: TEST_MERCHANT_ID, businessName: 'Test' },
        items: [],
        payment: null,
      });

      const res = await request(app)
        .get(`/api/orders/${TEST_ORDER_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
    });

    it('PUT /api/orders/:id/status (valid transition) → 200', async () => {
      mockPrisma.order.findUnique = vi.fn()
        .mockResolvedValueOnce({
          id: TEST_ORDER_ID,
          merchantId: TEST_MERCHANT_ID,
          status: 'PENDING',
          totalAmount: 50000,
        })
        .mockResolvedValueOnce({
          id: TEST_ORDER_ID,
          status: 'CONFIRMED',
          items: [],
          payment: null,
          customer: { id: TEST_CUSTOMER_ID, name: 'Budi', phone: '62811' },
        });
      mockPrisma.order.update = vi.fn().mockResolvedValue({});

      const res = await request(app)
        .put(`/api/orders/${TEST_ORDER_ID}/status`)
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('PUT /api/orders/:id/status (invalid transition) → 200 with success false', async () => {
      mockPrisma.order.findUnique = vi.fn().mockResolvedValue({
        id: TEST_ORDER_ID,
        merchantId: TEST_MERCHANT_ID,
        status: 'PENDING',
        totalAmount: 50000,
      });

      const res = await request(app)
        .put(`/api/orders/${TEST_ORDER_ID}/status`)
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/orders/:id/status (not found) → 200 with success false', async () => {
      mockPrisma.order.findUnique = vi.fn().mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/orders/${TEST_ORDER_ID}/status`)
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });
  });

  // ═══ 6. Conversations ══════════════════════════════════

  describe('Conversations', () => {
    it('GET /api/conversations → 200 list', async () => {
      mockPrisma.conversation.findMany = vi.fn().mockResolvedValue([
        {
          id: TEST_CONV_ID,
          status: 'ACTIVE',
          customer: { id: TEST_CUSTOMER_ID, name: 'Budi', phone: '62811' },
          _count: { messages: 3 },
        },
      ]);
      mockPrisma.conversation.count = vi.fn().mockResolvedValue(1);

      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /api/conversations/:id → 200 with messages', async () => {
      mockPrisma.conversation.findUnique = vi.fn().mockResolvedValue({
        id: TEST_CONV_ID,
        status: 'ACTIVE',
        customer: { id: TEST_CUSTOMER_ID, name: 'Budi', phone: '62811' },
        merchant: { id: TEST_MERCHANT_ID, businessName: 'Test' },
        messages: [
          { id: 'm1', role: 'CUSTOMER', content: 'Halo', createdAt: new Date() },
        ],
      });

      const res = await request(app)
        .get(`/api/conversations/${TEST_CONV_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(1);
    });

    it('GET /api/conversations/:id (not found) → 200 with success false', async () => {
      mockPrisma.conversation.findUnique = vi.fn().mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/conversations/${TEST_CONV_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/conversations/:id/messages → 200 paginated', async () => {
      mockPrisma.conversation.findUnique = vi.fn().mockResolvedValue({ id: TEST_CONV_ID });
      mockPrisma.message.findMany = vi.fn().mockResolvedValue([
        { id: 'm1', role: 'CUSTOMER', content: 'Halo', createdAt: new Date() },
      ]);
      mockPrisma.message.count = vi.fn().mockResolvedValue(1);

      const res = await request(app)
        .get(`/api/conversations/${TEST_CONV_ID}/messages`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ═══ 7. AI Agent ═══════════════════════════════════════

  describe('AI Agent', () => {
    it('GET /api/ai-agent/me → 200', async () => {
      mockPrisma.aIAgent.findUnique = vi.fn().mockResolvedValue({
        id: 'agent-1',
        merchantId: TEST_MERCHANT_ID,
        isActive: true,
        systemPrompt: 'You are a helpful assistant',
        model: 'deepseek-v4',
        greetingMessage: 'Halo!',
        knowledgeBase: null,
        maxTokens: 2048,
        temperature: 0.7,
      });

      const res = await request(app)
        .get('/api/ai-agent/me')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(true);
    });

    it('PUT /api/ai-agent/me (valid) → 200', async () => {
      mockPrisma.aIAgent.findUnique = vi.fn().mockResolvedValue({ id: 'agent-1', merchantId: TEST_MERCHANT_ID });
      mockPrisma.aIAgent.update = vi.fn().mockResolvedValue({
        id: 'agent-1',
        isActive: true,
        systemPrompt: 'Updated prompt',
        model: 'deepseek-v4',
        maxTokens: 2048,
        temperature: 0.7,
      });

      const res = await request(app)
        .put('/api/ai-agent/me')
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ systemPrompt: 'Updated prompt', model: 'deepseek-v4' });

      expect(res.status).toBe(200);
    });

    it('PUT /api/ai-agent/me (systemPrompt too long) → 400', async () => {
      const res = await request(app)
        .put('/api/ai-agent/me')
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ systemPrompt: '' });

      expect(res.status).toBe(400);
    });

    it('POST /api/ai-agent/me/toggle → 200 isActive berubah', async () => {
      mockPrisma.aIAgent.findUnique = vi.fn().mockResolvedValue({
        id: 'agent-1',
        merchantId: TEST_MERCHANT_ID,
        isActive: false,
      });
      mockPrisma.aIAgent.update = vi.fn().mockResolvedValue({
        id: 'agent-1',
        isActive: true,
      });

      const res = await request(app)
        .post('/api/ai-agent/me/toggle')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(true);
    });
  });

  // ═══ 8. Web Store ══════════════════════════════════════

  describe('Web Store', () => {
    it('GET /api/web-store/:merchantId → 200', async () => {
      mockPrisma.webStore.findUnique = vi.fn().mockResolvedValue({
        id: 'store-1',
        merchantId: TEST_MERCHANT_ID,
        slug: 'toko-test',
        template: 'modern',
        isPublished: false,
      });

      const res = await request(app)
        .get(`/api/web-store/${TEST_MERCHANT_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
    });

    it('PUT /api/web-store/:merchantId (valid) → 200', async () => {
      mockPrisma.webStore.findUnique = vi.fn().mockResolvedValue({
        id: 'store-1',
        merchantId: TEST_MERCHANT_ID,
        slug: 'toko-test',
        template: 'modern',
        isPublished: false,
      });
      mockPrisma.webStore.update = vi.fn().mockResolvedValue({
        id: 'store-1',
        slug: 'toko-test',
        seoTitle: 'Toko Kami',
        template: 'minimal',
        isPublished: false,
      });

      const res = await request(app)
        .put(`/api/web-store/${TEST_MERCHANT_ID}`)
        .set('Authorization', `Bearer ${merchantToken()}`)
        .send({ seoTitle: 'Toko Kami', template: 'minimal' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/web-store/:merchantId/publish → isPublished=true', async () => {
      mockPrisma.webStore.update = vi.fn().mockResolvedValue({
        id: 'store-1',
        merchantId: TEST_MERCHANT_ID,
        slug: 'toko-test',
        isPublished: true,
      });

      const res = await request(app)
        .post(`/api/web-store/${TEST_MERCHANT_ID}/publish`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isPublished).toBe(true);
    });

    it('GET /api/web-store/public/:slug → 200 public (no auth)', async () => {
      mockPrisma.webStore.findUnique = vi.fn().mockResolvedValue({
        id: 'store-1',
        slug: 'toko-test',
        template: 'modern',
        isPublished: true,
        seoTitle: 'Toko Kami',
        heroText: 'Selamat datang',
        merchant: {
          businessName: 'Test Merchant',
          phone: '6281234567890',
          address: null,
          categories: [],
        },
      });

      const res = await request(app).get('/api/web-store/public/toko-test');
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('toko-test');
    });

    it('GET /api/web-store/public/:slug (not found) → 200 with success false', async () => {
      mockPrisma.webStore.findUnique = vi.fn().mockResolvedValue(null);

      const res = await request(app).get('/api/web-store/public/tidak-ada');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });
  });

  // ═══ 9. Dashboard ═════════════════════════════════════

  describe('Dashboard', () => {
    it('GET /api/dashboard/stats → 200', async () => {
      mockPrisma.order.findMany = vi.fn().mockResolvedValue([]);
      mockPrisma.order.count = vi.fn().mockResolvedValue(0);
      mockPrisma.product.count = vi.fn().mockResolvedValue(0);
      mockPrisma.customer.count = vi.fn().mockResolvedValue(0);
      mockPrisma.activityLog.findMany = vi.fn().mockResolvedValue([]);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
    });

    it('GET /api/dashboard/recent-orders → 200', async () => {
      mockPrisma.order.findMany = vi.fn().mockResolvedValue([
        {
          id: TEST_ORDER_ID,
          status: 'PENDING',
          totalAmount: 50000,
          customer: { id: TEST_CUSTOMER_ID, name: 'Budi', phone: '62811' },
          items: [],
          payment: null,
        },
      ]);

      const res = await request(app)
        .get('/api/dashboard/recent-orders')
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ═══ 10. WA Session ═══════════════════════════════════

  describe('WA Session', () => {
    it('GET /api/wa-session/:merchantId/status → 200', async () => {
      mockPrisma.waSession.findUnique = vi.fn().mockResolvedValue({
        merchantId: TEST_MERCHANT_ID,
        status: 'disconnected',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/wa-session/${TEST_MERCHANT_ID}/status`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
    });

    it('POST /api/wa-session/:merchantId/connect → 200', async () => {
      const res = await request(app)
        .post(`/api/wa-session/${TEST_MERCHANT_ID}/connect`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
    });

    it('POST /api/wa-session/:merchantId/disconnect → 200', async () => {
      const res = await request(app)
        .post(`/api/wa-session/${TEST_MERCHANT_ID}/disconnect`)
        .set('Authorization', `Bearer ${merchantToken()}`);

      expect(res.status).toBe(200);
    });
  });
});
