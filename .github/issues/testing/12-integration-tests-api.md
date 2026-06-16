# TST-12 — Integration Tests: All API Endpoints

## Deskripsi
Buat integration test untuk semua REST API endpoints menggunakan Supertest. Test success case dan error case untuk tiap endpoint.

## Setup
- [ ] Setup test database (PostgreSQL terpisah atau SQLite)
- [ ] Setup `beforeAll`: migrate DB, seed data
- [ ] Setup `afterAll`: disconnect Prisma, cleanup
- [ ] Setup Supertest dengan Express app (import dari server.ts)
- [ ] Buat helper untuk generate JWT test token

## Task Checklist

### 1. Health & Auth — 6 test cases
- [ ] `GET /health` → 200, status ok
- [ ] `POST /api/auth/register` (valid) → 201, return JWT + merchant data
- [ ] `POST /api/auth/register` (duplicate phone) → 409
- [ ] `POST /api/auth/login` (valid) → 200, return JWT
- [ ] `POST /api/auth/login` (wrong password) → 401
- [ ] `GET /api/merchants/me` (no auth) → 401

### 2. Merchant — 3 test cases
- [ ] `GET /api/merchants/me` (with auth) → 200, merchant data
- [ ] `PUT /api/merchants/me` (valid) → 200, updated
- [ ] `GET /api/merchants/me/stats` → 200, stats object

### 3. Products — 8 test cases
- [ ] `GET /api/products` → 200, paginated list
- [ ] `POST /api/products` (valid) → 201, product created
- [ ] `POST /api/products` (invalid: no name) → 400
- [ ] `POST /api/products` (invalid: price negative) → 400
- [ ] `PUT /api/products/:id` (valid) → 200, updated
- [ ] `PUT /api/products/:id` (not found) → 404
- [ ] `DELETE /api/products/:id` → 200, deleted
- [ ] `DELETE /api/products/:id` (already deleted) → 404

### 4. Customers — 4 test cases
- [ ] `GET /api/customers` → 200, paginated list
- [ ] `GET /api/customers/:id` → 200, customer detail
- [ ] `GET /api/customers/:id` (not found) → 404
- [ ] `GET /api/customers?search=budi` → filtered results

### 5. Orders — 6 test cases
- [ ] `GET /api/orders` → 200, paginated + filterable
- [ ] `GET /api/orders?status=PENDING` → filtered
- [ ] `GET /api/orders/:id` → 200, with items + payment
- [ ] `PUT /api/orders/:id/status` (valid transition) → 200
- [ ] `PUT /api/orders/:id/status` (invalid transition) → 400
- [ ] `PUT /api/orders/:id/status` (not found) → 404

### 6. Conversations — 5 test cases
- [ ] `GET /api/conversations` → 200, list
- [ ] `GET /api/conversations/:id` → 200, with messages
- [ ] `POST /api/conversations/:id/messages` → 201, message saved
- [ ] `GET /api/conversations/:id/messages` → 200, paginated messages
- [ ] `POST /api/conversations/:id/messages` (empty content) → 400

### 7. AI Agent — 4 test cases
- [ ] `GET /api/ai-agent/:merchantId` → 200
- [ ] `PUT /api/ai-agent/:merchantId` (valid) → 200
- [ ] `PUT /api/ai-agent/:merchantId` (systemPrompt too long) → 400
- [ ] `POST /api/ai-agent/:merchantId/toggle` → isActive berubah

### 8. Web Store — 5 test cases
- [ ] `GET /api/web-store/:merchantId` → 200
- [ ] `PUT /api/web-store/:merchantId` (valid) → 200
- [ ] `POST /api/web-store/:merchantId/publish` → isPublished = true
- [ ] `GET /api/web-store/public/:slug` → 200 (public, no auth)
- [ ] `GET /api/web-store/public/:slug` (not found) → 404

### 9. Dashboard — 2 test cases
- [ ] `GET /api/dashboard/stats` → 200, stats object
- [ ] `GET /api/dashboard/recent-orders` → 200, array

### 10. WA Session — 3 test cases
- [ ] `GET /api/wa-session/:merchantId/status` → 200
- [ ] `POST /api/wa-session/:merchantId/connect` → 200
- [ ] `POST /api/wa-session/:merchantId/disconnect` → 200

## Target
- Minimal 45 test cases
- Coverage: semua endpoint success + error
- Test bisa jalan tanpa koneksi eksternal (mock Prisma)

## Labels
`testing`, `integration-test`, 🟡 medium

## Dependencies
TST-10, TST-11

## Estimasi
2 hari
