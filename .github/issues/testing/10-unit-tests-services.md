# TST-10 — Unit Tests: Business Services

## Deskripsi
Buat unit test untuk semua service layer: merchant, product, customer, order, payment, conversation, ai-agent, web-store. Target coverage >80% per service.

## Setup
- [ ] Buat `tests/setup.ts` — helper untuk test database
- [ ] Buat factory functions: `createTestMerchant()`, `createTestProduct()`, dll
- [ ] Setup Prisma mock atau test database terpisah

## Task Checklist

### 1. `merchant.service.ts` — 5-7 test cases
- [ ] `create(data)` → merchant terbuat dengan data benar
- [ ] `create(duplicate phone)` → throw error
- [ ] `getById(id)` → return merchant
- [ ] `getById(not found)` → return null
- [ ] `toggleActive(id)` → isActive berubah
- [ ] `getStats(id)` → return counts: products, orders, customers

### 2. `product.service.ts` — 8-10 test cases
- [ ] `create(data)` → product terbuat
- [ ] `getByMerchant(merchantId, pagination)` → paginated results
- [ ] `update(id, data)` → data berubah
- [ ] `delete(id)` → product terhapus
- [ ] `search(merchantId, keyword)` → filter by name/description
- [ ] `getAvailableProducts(merchantId)` → hanya isAvailable = true
- [ ] `updateStock(id, qty)` → stock berubah
- [ ] `updateStock(id, negative)` → error (jangan sampai stock minus)
- [ ] `toggleAvailability(id)` → isAvailable toggle

### 3. `customer.service.ts` — 5-7 test cases
- [ ] `findOrCreate(merchantId, phone, name)` → return existing atau baru
- [ ] `findOrCreate(phone sudah ada)` → return existing (no duplicate)
- [ ] `incrementOrderCount(id)` → totalOrders +1
- [ ] `search(merchantId, keyword)` → filter by name/phone
- [ ] `getCustomerOrders(id)` → list orders

### 4. `order.service.ts` — 8-10 test cases
- [ ] `create(data)` → order + items + payment terbuat
- [ ] `transitionStatus(PENDING → CONFIRMED)` → valid
- [ ] `transitionStatus(PENDING → PROCESSING)` → invalid (error)
- [ ] `transitionStatus(CONFIRMED → CANCELLED)` → stock restored
- [ ] `transitionStatus(CANCELLED → CONFIRMED)` → invalid
- [ ] `getPendingOrders(merchantId)` → hanya PENDING
- [ ] `getTodayOrders(merchantId)` → hanya hari ini
- [ ] `getOrderStats(merchantId)` → aggregasi

### 5. `payment.service.ts` — 5 test cases
- [ ] `payOrder(orderId, method, amount)` → payment terbuat
- [ ] `payOrder(orderId, already paid)` → update (upsert)
- [ ] `refundPayment(paymentId)` → status = REFUNDED
- [ ] `getPaymentStats(merchantId)` → sum revenue

### 6. `conversation.service.ts` — 5-7 test cases
- [ ] `findOrCreate(merchantId, customerId)` → return existing atau baru
- [ ] `sendMessage(conversationId, role, content)` → message saved
- [ ] `escalate(conversationId)` → status = ESCALATED + ActivityLog
- [ ] `resolve(conversationId)` → status = RESOLVED
- [ ] `getMessages(conversationId)` → paginated messages

### 7. `ai-agent.service.ts` — 5 test cases
- [ ] `upsert(merchantId, data)` → create or update
- [ ] `toggleActive(id)` → isActive berubah
- [ ] `updateSystemPrompt(id, prompt)` → prompt berubah
- [ ] `getByMerchant(merchantId)` → return ai agent

### 8. `web-store.service.ts` — 5 test cases
- [ ] `getWebStore(merchantId)` → return config
- [ ] `updateWebStore(slug, data)` → slug berubah
- [ ] `publish(merchantId)` → isPublished = true
- [ ] `getBySlug(slug)` → return published store
- [ ] `getBySlug(unpublished slug)` → return null / error

## Target
- Minimal 50 test cases
- Coverage >80% untuk services/
- Semua test passing: `pnpm --filter @wani/api test`

## Labels
`testing`, `unit-test`, 🟡 medium

## Dependencies
API-06, API-07, API-08, API-09

## Estimasi
2 hari
