# WANI API — Specification

> REST API untuk platform WANI. Base URL: `http://localhost:3001/api`
>
> **Status implementasi:** Semua endpoint **sudah ada** di server backend (`api/`).
> Dashboard **sudah terintegrasi** dengan API nyata (semua hooks pakai fetchApi, `MOCK = false`).

---

## Daftar Isi

1. [Format Respons & Auth](#1-format-respons--auth)
2. [Endpoint WA Session (Existing)](#2-endpoint-wa-session-existing)
3. [Endpoint AI Chat (Existing)](#3-endpoint-ai-chat-existing)
4. [Endpoint Dashboard Stats (Implemented)](#4-endpoint-dashboard-stats-planned)
5. [Endpoint Products (Implemented)](#5-endpoint-products-planned)
6. [Endpoint Orders (Implemented)](#6-endpoint-orders-planned)
7. [Endpoint Customers + Chats (Implemented)](#7-endpoint-customers--chats-planned)
8. [Endpoint Settings (Implemented)](#8-endpoint-settings-planned)
9. [Endpoint Store Payment Methods (Implemented)](#9-endpoint-store-payment-methods-implemented)
10. [Endpoint Upload (Implemented)](#10-endpoint-upload-implemented)
11. [Endpoint Activity Log & Usage (Implemented)](#11-endpoint-activity-log--usage-planned)
12. [Endpoint Website (Implemented)](#12-endpoint-website-planned)
13. [Endpoint Auth (Implemented)](#13-endpoint-auth-planned)
14. [Endpoint Debug (Existing)](#14-endpoint-debug-existing)
15. [Error Codes](#15-error-codes)

---

## 1. Format Respons & Auth

### Unified JSON Response

```typescript
// Success (status < 400)
{
  "status": "success",
  "message": string,
  "data": T | null
}

// Error (status >= 400)
{
  "status": "failure",
  "message": string,
  "data": null | ZodIssue[]
}
```

### Authentication

Untuk endpoint yang butuh auth:
```
Authorization: Bearer {API_TOKEN}
```

`API_TOKEN` dari env variable. Endpoint yang butuh auth ditandai dengan 🔒.

### Format Halaman (Pagination)

Semua endpoint `GET /api/*` (list) akan mendukung pagination:

```typescript
// Query params
?page=1&limit=20&search=keyword&sort=createdAt&order=desc

// Response data shape untuk list
{
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

---

## 2. Endpoint WA Session (Existing)

Database: `WaSession` — single-row (`id: "default"`).

### GET /api/qr

Ambil QR code string.

```typescript
// Response 200
{
  "status": "success",
  "message": "qr retrieved",
  "data": { "qr": string | null }
}
```

### GET /api/qr/status

Ambil status koneksi + nomor telepon.

```typescript
// Response 200
{
  "status": "success",
  "message": "status retrieved",
  "data": {
    "status": "connected" | "disconnected" | "connecting",
    "phone": string | null
  }
}
```

### POST /api/qr 🔒

Push QR / update status (dari wa-bot).

```typescript
// Body
{
  "qr": string | null      // optional
  "status": string          // optional
  "phone": string | null    // optional
}

// Response 200
{
  "status": "success",
  "message": "qr updated"
}
```

### DELETE /api/qr 🔒

Clear QR setelah connect sukses.

```typescript
// Response 200
{
  "status": "success",
  "message": "qr cleared"
}
```

---

## 3. Endpoint AI Chat (Existing)

Database: `Conversation` + `Message` + `Customer` + `ActivityLog` + `UsageCounter`.

### POST /api/chat 🔒

Process incoming WhatsApp message through the 18-step AI pipeline and return a reply.

```typescript
// Request Body
{
  "phone": string,        // required — customer phone number
  "text": string,          // required — message text
  "name"?: string,         // optional — customer name
  "waMsgId"?: string       // optional — WhatsApp message ID for dedup
}

// Response 200
{
  "status": "success",
  "message": "ok",
  "data": {
    "reply": string,       // AI-generated reply text
    "intent": "order" | "inquiry" | "greeting" | "complaint" | "unknown" | "escalate"
  }
}
```

#### Pipeline (18 steps)

1. `normalizeInput` — strip control chars + NFKC normalize + trim
2. `upsert customer + conversation`
3. `dedup by waMsgId`
4. `persist inbound message`
5. `checkRateLimit` — per-customer sliding window
6. `scanPii` — log PII matches (phone, email, NIK, API key, address)
7. `3-tier injection defense`
   - **T1 regex** (always, ~0ms) — 9 attack-class groups → SAFE/BLOCK/UNCERTAIN
   - **T2 classifier** (conditional) — OpenRouter fast model → SAFE/INJECTION/SUSPICIOUS
   - **T3 deep judge** (conditional) — LLM-as-judge with history → SAFE/BLOCK
8. `isBudgetExceeded` — daily LLM call budget
9. `load context` — Store + Product + AiConfig → system prompt
10. `build messages` — history (10) + current message
11. `LLM call via circuit breaker` — OpenRouter, retry (2×), fallback model, 30s timeout
12. `parse LLM output` — JSON extraction + Zod validation → 6 intents
13. `handleIntent` — execute action (create order, log escalation, etc.)
14. `sanitizeReply` — strip code fences, cap length
15. `scanOutput` — canary, delimiter, system prompt, PII leak, exfiltration
16. `redactPii` — replace leaked PII with type markers
17. `checkGrounding` — [inquiry/order only] factual accuracy via LLM-judge
18. `record usage + persist outbound + touch conversation`

> Setiap langkah di-trace oleh ring buffer debug tracer. Lihat [Debug Endpoints](#12-endpoint-debug-existing).

---

## 4. Endpoint Dashboard Stats (Implemented)

### GET /api/dashboard/stats

Overview stats untuk halaman utama dashboard.

```typescript
// Response 200
{
  "status": "success",
  "data": {
    "ordersToday": number,
    "ordersPending": number,
    "productsActive": number,
    "customersTotal": number,
    "conversationsActive": number,
    "qr": { "qr": string | null, "status": string, "phone": string | null }
  }
}
```

---

## 5. Endpoint Products (Implemented)

Database: `Product` + `Category`.

### GET /api/products

Daftar produk (paginated, searchable).

```typescript
// Query params
?page=1&limit=20&search=nama&categoryId=xxx&isAvailable=true&sort=createdAt&order=desc

// Response 200
{
  "status": "success",
  "data": {
    "items": [{
      "id": string,
      "categoryId": string | null,
      "category": { "id": string, "name": string } | null,
      "name": string,
      "description": string | null,
      "price": number,            // DECIMAL(12,2)
      "stock": number,
      "isAvailable": boolean,
      "imageUrl": string | null,
      "createdAt": string,        // ISO 8601
      "updatedAt": string
    }],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

### GET /api/products/:id

Detail produk.

```typescript
// Response 200
{
  "status": "success",
  "data": {
    "id": string,
    "categoryId": string | null,
    "category": { "id": string, "name": string } | null,
    "name": string,
    "description": string | null,
    "price": number,
    "stock": number,
    "isAvailable": boolean,
    "imageUrl": string | null,
    "createdAt": string,
    "updatedAt": string
  }
}
```

### POST /api/products 🔒

Tambah produk.

```typescript
// Body
{
  "name": string,              // required
  "categoryId": string | null, // optional
  "description": string | null,
  "price": number,             // required, min 0
  "stock": number,             // optional, default 0
  "isAvailable": boolean,      // optional, default true
  "imageUrl": string | null    // optional
}

// Response 201
{ "status": "success", "message": "product created", "data": { ...product } }
```

### PUT /api/products/:id 🔒

Update produk.

```typescript
// Body (partial)
{
  "name"?: string,
  "categoryId"?: string | null,
  "description"?: string | null,
  "price"?: number,
  "stock"?: number,
  "isAvailable"?: boolean,
  "imageUrl"?: string | null
}

// Response 200
{ "status": "success", "message": "product updated", "data": { ...product } }
```

### DELETE /api/products/:id 🔒

Hapus produk.

```typescript
// Response 200
{ "status": "success", "message": "product deleted" }

// Error 400 — cannot delete product with existing order items
```

### GET /api/products/categories

Daftar kategori.

```typescript
// Response 200
{
  "data": {
    "items": [
      { "id": string, "name": string, "description": string | null, "productCount": number }
    ]
  }
}
```

### POST /api/products/categories 🔒

```typescript
// Body
{ "name": string, "description"?: string | null }

// Response 201
```

### PUT /api/products/categories/:id 🔒

```typescript
// Body (partial)
{ "name"?: string, "description"?: string | null }

// Response 200
```

### DELETE /api/products/categories/:id 🔒

```typescript
// Response 200
```

---

## 6. Endpoint Orders (Implemented)

Database: `Order` + `OrderItem` + `Payment`.

Enums:
- `OrderStatus`: `PENDING | CONFIRMED | PROCESSING | COMPLETED | CANCELLED`
- `PaymentMethod`: `CASH | TRANSFER | QRIS`
- `PaymentStatus`: `PENDING | PAID | FAILED | REFUNDED`

### GET /api/orders

Daftar order (paginated, filterable).

```typescript
// Query params
?page=1&limit=20&status=PENDING&customerId=xxx&dateFrom=2026-01-01&dateTo=2026-06-22&sort=createdAt&order=desc

// Response 200
{
  "data": {
    "items": [{
      "id": string,
      "customerId": string,
      "customer": { "id": string, "name": string, "phone": string },
      "status": OrderStatus,
      "totalAmount": number,
      "source": string,
      "notes": string | null,
      "items": [{
        "id": string,
        "productId": string,
        "product": { "id": string, "name": string },
        "qty": number,
        "unitPrice": number,
        "subtotal": number
      }],
      "payment": {
        "method": PaymentMethod | null,
        "amount": number,
        "status": PaymentStatus,
        "paidAt": string | null
      } | null,
      "createdAt": string,
      "updatedAt": string
    }],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

### GET /api/orders/:id

Detail order.

```typescript
// Response 200
{
  "data": {
    "id": string,
    "customer": { "id": string, "name": string, "phone": string },
    "status": OrderStatus,
    "totalAmount": number,
    "source": string,
    "notes": string | null,
    "items": [{ ... }],
    "payment": { ... } | null,
    "createdAt": string,
    "updatedAt": string
  }
}
```

### PUT /api/orders/:id/status 🔒

Update status order (workflow: PENDING → CONFIRMED → PROCESSING → COMPLETED).

```typescript
// Body
{ "status": OrderStatus }

// Response 200
{ "status": "success", "message": "order status updated", "data": { ...order } }

// Error 400 — invalid status transition
```

### PUT /api/orders/:id/notes 🔒

Update notes order.

```typescript
// Body
{ "notes": string }

// Response 200
```

### PUT /api/orders/:id/payment 🔒

Update / set payment untuk order.

```typescript
// Body
{
  "method": PaymentMethod,
  "amount": number,
  "status": PaymentStatus,
  "paidAt": string | null   // ISO 8601
}

// Response 200
```

---

## 7. Endpoint Customers + Chats (Implemented)

Database: `Customer` + `Conversation` + `Message`.

### Enums

- `ConversationStatus`: `ACTIVE | RESOLVED | ARCHIVED | ESCALATED`
- `MessageRole`: `CUSTOMER | BOT | HUMAN`

### GET /api/customers

```typescript
// Query params
?page=1&limit=20&search=name|phone&sort=createdAt&order=desc

// Response 200
{
  "data": {
    "items": [{
      "id": string,
      "phone": string,
      "name": string,
      "notes": string | null,
      "totalOrders": number,
      "unreadCount": number,
      "lastMessage": { "content": string, "role": MessageRole, "createdAt": string } | null,
      "recentOrder": { "id": string, "status": OrderStatus, "totalAmount": number, "createdAt": string } | null,
      "createdAt": string,
      "updatedAt": string
    }],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

### GET /api/customers/:id

Detail customer + riwayat order + percakapan.

```typescript
// Response 200
{
  "data": {
    "id": string,
    "phone": string,
    "name": string,
    "notes": string | null,
    "totalOrders": number,
    "orders": [{
      "id": string,
      "status": OrderStatus,
      "totalAmount": number,
      "createdAt": string
    }],
    "conversation": {
      "id": string,
      "status": ConversationStatus,
      "messages": [{
        "id": string,
        "role": MessageRole,
        "content": string,
        "msgType": string,
        "waMsgId": string | null,
        "metadata": Record<string, unknown> | null,
        "createdAt": string
      }]
    } | null,
    "createdAt": string,
    "updatedAt": string
  }
}
```

### PUT /api/customers/:id 🔒

Update data customer.

```typescript
// Body
{ "name"?: string, "notes"?: string | null }

// Response 200
```

---

## 8. Endpoint Settings (Implemented)

Gabungan: **Store Profile** + **AI Config** + **WA Session** — semuanya single-row (`id: "default"`).

### GET /api/store

Profil toko.

```typescript
// Response 200
{
  "data": {
    "id": "default",
    "businessName": string,
    "phone": string,
    "logoUrl": string | null,
    "address": string | null,
    "businessHours": string | null,
    "paymentMethods": string | null,
    "shippingInfo": string | null,
    "returnPolicy": string | null,
    "isActive": boolean,
    "hasPaymentMethods": boolean,     // true jika ada StorePaymentMethod aktif
    "createdAt": string,
    "updatedAt": string
  }
}
```

### PUT /api/store 🔒

```typescript
// Body
{
  "businessName"?: string,
  "phone"?: string,
  "logoUrl"?: string | null,
  "address"?: string | null,
  "businessHours"?: string | null,
  "paymentMethods"?: string | null,
  "shippingInfo"?: string | null,
  "returnPolicy"?: string | null,
  "isActive"?: boolean
}

// Response 200
```

### GET /api/ai-config

```typescript
// Response 200
{
  "data": {
    "id": "default",
    "isActive": boolean,
    "systemPrompt": string,
    "model": string,
    "greetingMessage": string | null,
    "knowledgeBase": string | null,
    "maxTokens": number,
    "temperature": number,
    "createdAt": string,
    "updatedAt": string
  }
}
```

### PUT /api/ai-config 🔒

```typescript
// Body
{
  "isActive"?: boolean,
  "systemPrompt"?: string,
  "model"?: string,
  "greetingMessage"?: string | null,
  "knowledgeBase"?: string | null,
  "maxTokens"?: number,
  "temperature"?: number
}

// Response 200
```

---

## 9. Endpoint Store Payment Methods (Implemented)

Database: `StorePaymentMethod`.

### GET /api/store/payment-methods

Daftar semua metode pembayaran toko.

```typescript
// Response 200
{
  "status": "success",
  "data": [{
    "id": string,
    "type": "QRIS" | "BANK_TRANSFER" | "E_WALLET" | "COD",
    "label": string,
    "accountName": string | null,
    "accountNumber": string | null,
    "bankName": string | null,
    "providerName": string | null,
    "phoneNumber": string | null,
    "qrImageUrl": string | null,
    "instructions": string | null,
    "isActive": boolean,
    "sortOrder": number
  }]
}
```

### POST /api/store/payment-methods 🔒 JWT

Tambah metode pembayaran baru.

```typescript
// Body — discriminated union berdasarkan type
// QRIS:
{ "type": "QRIS", "label": string, "qrImageUrl": string, "instructions"?: string }

// BANK_TRANSFER:
{ "type": "BANK_TRANSFER", "label": string, "bankName": string, "accountNumber": string, "accountName": string }

// E_WALLET:
{ "type": "E_WALLET", "label": string, "providerName": string, "phoneNumber": string, "accountName"?: string }

// COD:
{ "type": "COD", "label": string, "instructions": string }

// Response 201
{ "status": "success", "message": "payment method created", "data": { ...method } }
```

### PUT /api/store/payment-methods/:id 🔒 JWT

Edit metode pembayaran.

```typescript
// Body (partial — fields sesuai type)
{ "label"?: string, "isActive"?: boolean, ... }

// Response 200
{ "status": "success", "message": "payment method updated", "data": { ...method } }
```

### DELETE /api/store/payment-methods/:id 🔒 JWT

Hapus metode pembayaran.

```typescript
// Response 200
{ "status": "success", "message": "payment method deleted" }
```

---

## 10. Endpoint Upload (Implemented)

### POST /api/upload 🔒 JWT

Upload file gambar (untuk QRIS).

```
Content-Type: multipart/form-data
Body: file (image/png, image/jpeg, image/webp, max 2MB)

Response 201:
{
  "status": "success",
  "data": { "url": "/uploads/qris-abc123.png" }
}
```

---

## 11. Endpoint Activity Log & Usage (Implemented)

### GET /api/logs

```typescript
// Query params
?page=1&limit=20&type=order_created&referenceId=xxx&dateFrom=...&dateTo=...

// Response 200
{
  "data": {
    "items": [{
      "id": string,
      "type": string,
      "referenceId": string | null,
      "description": string,
      "metadata": Record<string, unknown> | null,
      "createdAt": string
    }],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

### GET /api/usage

```typescript
// Response 200
{
  "data": {
    "llmCalls": number,
    "tokensIn": number,
    "tokensOut": number
  }
}
```

---

## 12. Endpoint Website (Implemented)

### POST /api/website/generate 🔒

Generate website dari konfigurasi yang diberikan.

```typescript
// Request Body
{
  "heroHeadline": string,
  "heroSubheadline": string,
  "aboutText": string,
  "primaryColor": string,
  "secondaryColor": string,
  "phone": string,
  "selectedProductIds": string[],
  "template": string
}

// Response 200
{
  "status": "success",
  "message": "website generated",
  "data": {
    "id": string,
    "timestamp": string,
    "productCount": number
  }
}
```

### GET /api/website/download

Download ZIP hasil generate.

```typescript
// Response 200 — file download (Content-Type: application/zip)
```

### POST /api/website/publish 🔒

Publish website ke hosting.

```typescript
// Body
{}

// Response 200
{
  "status": "success",
  "message": "website published"
}
```

---

## 13. Endpoint Auth (Implemented)

Database: `User`.

### POST /api/auth/register

Daftar akun baru.

```typescript
// Body
{
  "name": string,         // required
  "email": string,         // required, valid email
  "password": string       // required, min 8 chars
}

// Response 201
{
  "status": "success",
  "data": {
    "token": string,
    "user": {
      "id": string,
      "name": string,
      "email": string,
      "role": "admin"
    }
  }
}

// Error 409 — email already registered
```

### POST /api/auth/login

Masuk dengan email & password.

```typescript
// Body
{
  "email": string,         // required
  "password": string       // required
}

// Response 200
{
  "status": "success",
  "data": {
    "token": string,
    "user": {
      "id": string,
      "name": string,
      "email": string,
      "role": "admin"
    }
  }
}

// Error 401 — email/password salah
```

### GET /api/auth/me 🔒

Ambil data user dari token yang sedang aktif.

```typescript
// Headers
Authorization: Bearer {token}

// Response 200
{
  "status": "success",
  "data": {
    "id": string,
    "name": string,
    "email": string,
    "role": "admin"
  }
}

// Error 401 — token invalid/expired
```

### POST /api/auth/logout 🔒

Invalidasi token (opsional — bisa juga cukup clear token di client).

```typescript
// Response 200
{ "status": "success", "message": "logged out" }
```

### POST /api/auth/forgot-password

Kirim email reset password.

```typescript
// Body
{ "email": string }

// Response 200
{ "status": "success", "message": "reset link sent" }
```

### POST /api/auth/reset-password

Reset password dengan token dari email.

```typescript
// Body
{
  "token": string,         // dari email
  "password": string       // new password, min 8 chars
}

// Response 200
{ "status": "success", "message": "password reset" }

// Error 400 — token invalid/expired
```

---

## 14. Endpoint Debug (Existing)

Dev-only tooling. Hanya aktif ketika `NODE_ENV !== "production"`.

### GET /api/debug/traces

Ambil pipeline traces terbaru (in-memory ring buffer).

```typescript
// Query params
?limit=50

// Response 200
{
  "data": {
    "traces": [{ "id": string, "phone": string, "intent": string, "stages": object[], "duration": number, "timestamp": string }]
  }
}
```

### GET /api/debug/traces/:id

Detail satu trace by ID.

```typescript
// Response 200
{
  "data": { ...trace }
}

// Error 404 — trace not found
```

### DELETE /api/debug/traces

Hapus semua traces.

### GET /api/debug/status

Status server + circuit breaker.

```typescript
{
  "data": {
    "uptime": number,
    "memory": object,
    "circuitBreaker": { "state": string, "failures": number }
  }
}
```

### POST /api/debug/circuit/reset

Reset circuit breaker ke closed state.

---

## 15. Error Codes

| Status | Class | Penyebab |
|--------|-------|----------|
| 400 | `BadRequestError` | Body tidak valid (Zod validation), parameter salah |
| 401 | `UnauthorizedError` | Token tidak ada atau tidak cocok |
| 403 | `ForbiddenError` | Tidak punya akses |
| 404 | `NotFoundError` | Resource tidak ditemukan |
| 409 | `ConflictError` | Duplicate entry (category name, customer phone) |
| 500 | `InternalServerError` | Error server |

### Contoh Error Response

```json
{
  "status": "failure",
  "message": "Validation failed",
  "data": [
    { "path": "price", "message": "Required" },
    { "path": "name", "message": "String must contain at least 1 character(s)" }
  ]
}
```

---

## Ringkasan Endpoint

| Method | Path | Auth | Status | Keterangan |
|--------|------|------|--------|------------|
| `GET` | `/api/qr` | — | ✅ Existing | |
| `GET` | `/api/qr/status` | — | ✅ Existing | |
| `POST` | `/api/qr` | 🔒 | ✅ Existing | |
| `DELETE` | `/api/qr` | 🔒 | ✅ Existing | |
| `POST` | `/api/chat` | 🔒 | ✅ Existing | 18-step AI pipeline |
| `GET` | `/api/store` | — | ✅ Existing | Settings tab: Store |
| `PUT` | `/api/store` | 🔒 | ✅ Existing | Settings tab: Store |
| `GET` | `/api/ai-config` | 🔒 JWT | ✅ Existing | Settings tab: AI Agent |
| `PUT` | `/api/ai-config` | 🔒 JWT | ✅ Existing | Settings tab: AI Agent |
| `GET` | `/api/debug/traces` | — | ✅ Existing | |
| `GET` | `/api/debug/traces/:id` | — | ✅ Existing | |
| `DELETE` | `/api/debug/traces` | — | ✅ Existing | |
| `GET` | `/api/debug/status` | — | ✅ Existing | |
| `POST` | `/api/debug/circuit/reset` | — | ✅ Existing | |
| `GET` | `/api/dashboard/stats` | — | ✅ Existing | |
| `GET` | `/api/products` | — | ✅ Existing | |
| `GET` | `/api/products/:id` | — | ✅ Existing | |
| `POST` | `/api/products` | 🔒 | ✅ Existing | |
| `PUT` | `/api/products/:id` | 🔒 | ✅ Existing | |
| `DELETE` | `/api/products/:id` | 🔒 | ✅ Existing | |
| `GET` | `/api/products/categories` | — | ✅ Existing | |
| `POST` | `/api/products/categories` | 🔒 | ✅ Existing | |
| `PUT` | `/api/products/categories/:id` | 🔒 | ✅ Existing | |
| `DELETE` | `/api/products/categories/:id` | 🔒 | ✅ Existing | |
| `GET` | `/api/orders` | — | ✅ Existing | Paginated, filterable |
| `GET` | `/api/orders/:id` | — | ✅ Existing | Detail + items + payment |
| `PUT` | `/api/orders/:id/status` | 🔒 | ✅ Existing | Status transition validation |
| `PUT` | `/api/orders/:id/notes` | 🔒 | ✅ Existing | |
| `PUT` | `/api/orders/:id/payment` | 🔒 | ✅ Existing | Create / update |
| `GET` | `/api/customers` | — | ✅ Existing | Paginated, searchable |
| `GET` | `/api/customers/:id` | — | ✅ Existing | Detail + orders + conversation |
| `PUT` | `/api/customers/:id` | 🔒 | ✅ Existing | |
| `GET` | `/api/conversations/:id` | — | ✅ Existing | Messages list |
| `PUT` | `/api/conversations/:id/status` | 🔒 | ✅ Existing | |
| `POST` | `/api/conversations/:id/messages` | 🔒 | ✅ Existing | Send HUMAN |
| `GET` | `/api/logs` | — | ✅ Existing | Activity log |
| `GET` | `/api/usage` | — | ✅ Existing | LLM counters |
| `GET` | `/api/website` | — | ✅ Existing | Get config |
| `PUT` | `/api/website` | 🔒 JWT | ✅ Existing | Update config |
| `POST` | `/api/website/generate` | 🔒 JWT | ✅ Existing | Web-Gen integration |
| `GET` | `/api/website/download` | 🔒 JWT | ✅ Existing | Download ZIP |
| `POST` | `/api/website/publish` | 🔒 JWT | ✅ Existing | Mark published |
| `GET` | `/api/website/generations` | 🔒 JWT | ✅ Existing | List generation history |
| `DELETE` | `/api/website/generations/:id` | 🔒 JWT | ✅ Existing | Delete generation record |
| `POST` | `/api/auth/register` | — | ✅ Existing | |
| `POST` | `/api/auth/login` | — | ✅ Existing | |
| `GET` | `/api/auth/me` | 🔒 JWT | ✅ Existing | Auto-verify token |
| `POST` | `/api/auth/logout` | — | ✅ Existing | |
| `POST` | `/api/auth/forgot-password` | — | ✅ Existing | |
| `POST` | `/api/auth/reset-password` | — | ✅ Existing | |
| `GET` | `/api/store/payment-methods` | — | ✅ Existing | List payment methods |
| `POST` | `/api/store/payment-methods` | 🔒 JWT | ✅ Existing | Add payment method |
| `PUT` | `/api/store/payment-methods/:id` | 🔒 JWT | ✅ Existing | Update payment method |
| `DELETE` | `/api/store/payment-methods/:id` | 🔒 JWT | ✅ Existing | Delete payment method |
| `POST` | `/api/upload` | 🔒 JWT | ✅ Existing | Upload file |
| `GET` | `/api/health` | — | ✅ Existing | Health check |
| `GET` | `/api/metrics` | — | ✅ Existing | Prometheus metrics |
| `GET` | `/api/outgoing` | 🔒 | ✅ Existing | List outgoing wa-bot messages |
| `PATCH` | `/api/outgoing/:id/delivered` | 🔒 | ✅ Existing | Mark message delivered |
| `GET` | `/s/:slug` | — | ✅ Existing | Serve generated static site |

---

> **Catatan Implementasi**: Semua endpoint sudah diimplementasikan di backend (`api/`).
> Dashboard hooks menggunakan `fetchApi()` dengan JWT auth dari localStorage.
> Lihat [ARSITEKTUR.md](../api/ARSITEKTUR.md) untuk detail arsitektur API.
