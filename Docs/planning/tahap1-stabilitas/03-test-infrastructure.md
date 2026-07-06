# Test Infrastructure — Tahap 1

> Rencana implementasi test untuk mencapai coverage ≥ 40%
> **Status:** ✅ 3 dari 4 modul complete (2026-07-03)
> - [x] API: 22 files, 223 tests, **82% coverage** ✅
> - [x] Dashboard: 7 files, 97 tests ✅ (vitest + jsdom)
> - [x] Web-Gen: 2 files, 37 tests, **82% coverage** ✅
> - [ ] WA-Bot: not started

---

## Current State

| Modul | Coverage | Test Files | Framework |
|-------|----------|-----------|-----------|
| api | ~40% | 16 | bun:test |
| dashboard | 0% | 0 | — |
| web-gen | 0% | 0 | — |
| wa-bot | ~15% | 1 | bun:test |

## Target Tahap 1

| Modul | Target Coverage | Target Test Files |
|-------|----------------|-------------------|
| api | ≥ 40% → 50% | +5 files |
| dashboard | ≥ 30% | +8 files |
| web-gen | ≥ 30% | +4 files |
| wa-bot | ≥ 30% | +3 files |

---

## API — Test yang Harus Ditambah

### 1. Integration Tests — HTTP Endpoints
**File baru:** `api/test/integration/`

```typescript
// api/test/integration/store.test.ts
// Test: GET/PUT /api/store
// Test: GET/POST/PUT/DELETE /api/store/payment-methods

// api/test/integration/auth.test.ts
// Test: POST /api/auth/login (success + wrong password)
// Test: POST /api/auth/register (success + duplicate email)
// Test: GET /api/auth/me (valid token + expired token)

// api/test/integration/products.test.ts
// Test: Full CRUD cycle untuk products
// Test: Category CRUD
// Test: Product search + pagination
```

### 2. Unit Tests — AI Engine
**File baru:** `api/test/ai/`

```typescript
// api/test/ai/engine.test.ts
// Test: complete() retry logic (mock fetch)
// Test: fallback model on failure
// Test: timeout handling
// Test: circuit breaker open/close/half-open

// api/test/ai/actions.test.ts
// Test: handleIntent() untuk setiap intent type
// Test: order creation dengan stock resolution
// Test: greeting reply format
```

### 3. Unit Tests — Models
**File baru:** `api/test/models/`

```typescript
// api/test/models/order.test.ts
// Test: create order dengan items + payment
// Test: status transition validation
// Test: stock release logic
```

---

## Dashboard — Test yang Harus Ditambah

### 1. Hook Unit Tests
**File baru:** `dashboard/src/hooks/__tests__/`

```typescript
// useProducts.test.ts
// Test: fetch products on mount
// Test: search/filter/sort logic (client-side)
// Test: create/update/delete product (mock fetchApi)
// Test: cancellation on unmount

// useOrders.test.ts
// Test: fetch orders + mapping ApiOrder → Order
// Test: status flow validation (statusFlow)
// Test: confirmPayment

// useCustomers.test.ts
// Test: fetch customers
// Test: sendMessage (mock fetchApi)
// Test: conversation loading (FIX: convLoading state)

// useAuth.test.ts
// Test: login success/failure
// Test: register success/failure
// Test: auto-restore from localStorage
// Test: logout cleanup

// useSettings.test.ts
// Test: parallel fetch store + ai-config
// Test: update store
// Test: update ai config
```

### 2. Utility Tests
```typescript
// format.test.ts
// Test: formatPrice() dengan berbagai nilai
// Test: formatDate() dengan berbagai format
```

### 3. Component Tests (opsional untuk Tahap 1)
```typescript
// Button.test.tsx — render variants, click handler
// Modal.test.tsx — open/close, escape key, backdrop click
```

---

## Web-Gen — Test yang Harus Ditambah

### 1. Template Engine Tests
**File baru:** `web-gen/test/`

```typescript
// web-gen/test/generator.test.ts
// Test: generate() dengan HTML template
// Test: generate() dengan Astro template
// Test: generate() dengan invalid template (error handling)
// Test: variable substitution {{var}}
// Test: conditional section {{#section}}...{{/section}}
// Test: negation section {{^section}}...{{/section}}
// Test: partial injection {{>partial}}
// Test: product loop {{#products}}...{{/products}}

// web-gen/test/zip.test.ts
// Test: createZipStream mengembalikan ReadableStream
// Test: createZipFile menulis ke disk
// Test: zip berisi file yang benar
```

### 2. Build Script Tests
```typescript
// web-gen/test/build-css.test.ts
// Test: extractTailwindConfig dari HTML
// Test: build tema classic
// Test: build tema modern
```

---

## WA-Bot — Test yang Harus Ditambah

### 1. Main Bot Logic Tests
**File baru:** `wa-bot/test/`

```typescript
// wa-bot/test/index.test.ts
// Test: message handler (mock Baileys socket)
// Test: QR code POST ke API
// Test: connection update handler
// Test: outgoing message polling
// Test: reset signal polling
// Test: graceful shutdown (SIGINT/SIGTERM)

// wa-bot/test/db.test.ts
// Test: PrismaClient singleton (globalThis caching)
// Test: connection string construction
```

---

## Test Setup untuk Dashboard

Karena dashboard belum punya test framework sama sekali, perlu setup:

```bash
cd dashboard
bun add -d @testing-library/react @testing-library/jest-dom jsdom
```

**File baru:** `dashboard/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**File baru:** `dashboard/src/test-setup.ts`
```typescript
import '@testing-library/jest-dom/vitest'
```

**Update `dashboard/package.json`:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## Test Setup untuk Web-Gen

```bash
cd web-gen
# bun:test sudah built-in, tidak perlu install tambahan
```

**Update `web-gen/package.json`:**
```json
{
  "scripts": {
    "test": "bun test"
  }
}
```

---

## CI Integration (Persiapan untuk Tahap 4)

```yaml
# .github/workflows/test.yml (nanti di Tahap 4)
jobs:
  test-api:
    - run: cd api && bun test
  test-dashboard:
    - run: cd dashboard && bun test
  test-web-gen:
    - run: cd web-gen && bun test
  test-wa-bot:
    - run: cd wa-bot && bun test
```

---

## Definition of Done

- [ ] `cd api && bun test` — ≥ 40% coverage
- [ ] `cd dashboard && bun test` — ≥ 30% coverage, 0 failures
- [ ] `cd web-gen && bun test` — ≥ 30% coverage, 0 failures
- [ ] `cd wa-bot && bun test` — ≥ 30% coverage, 0 failures
- [ ] Tidak ada test yang flaky
- [ ] Test bisa dijalankan di CI (tidak bergantung pada state lokal)
