# WANI API — Specification

> REST API untuk platform WANI. Base URL: `http://localhost:3001/api`
>
> **Status implementasi:** Saat ini hanya endpoint QR yang sudah ada di server.
> Semua endpoint lain (Products, Orders, Customers, Settings, dll) **belum diimplementasikan**
> di backend — dashboard menggunakan **mock data inline** di tiap hook (`MOCK = true`).
> Spesifikasi di bawah adalah **kontrak/rencana** untuk implementasi mendatang.

---

## Daftar Isi

1. [Format Respons & Auth](#1-format-respons--auth)
2. [Endpoint WA Session (Existing)](#2-endpoint-wa-session-existing)
3. [Endpoint Dashboard Stats (Planned)](#3-endpoint-dashboard-stats-planned)
4. [Endpoint Products (Planned)](#4-endpoint-products-planned)
5. [Endpoint Orders (Planned)](#5-endpoint-orders-planned)
6. [Endpoint Customers + Chats (Planned)](#6-endpoint-customers--chats-planned)
7. [Endpoint Settings (Planned)](#7-endpoint-settings-planned)
8. [Endpoint Activity Log & Usage (Planned)](#8-endpoint-activity-log--usage-planned)
9. [Endpoint Auth (Planned)](#9-endpoint-auth-planned)
10. [Error Codes](#10-error-codes)

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

## 3. Endpoint Dashboard Stats (Planned)

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

## 4. Endpoint Products (Planned)

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

## 5. Endpoint Orders (Planned)

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

## 6. Endpoint Customers + Chats (Planned)

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

## 7. Endpoint Settings (Planned)

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

### GET /api/qr/settings

Detail WA Session untuk ditampilkan di Settings (QR, nomor, status).

```typescript
// Response 200
{
  "data": {
    "status": "connected" | "disconnected" | "connecting",
    "phone": string | null,
    "qr": string | null
  }
}
```

### POST /api/qr/disconnect 🔒

Putuskan koneksi WA.

```typescript
// Response 200
{ "status": "success", "message": "disconnected" }
```

---

## 8. Endpoint Activity Log & Usage (Planned)

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

## 9. Endpoint Auth (Planned)

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

## 10. Error Codes

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

| Method | Path | Auth | Status |
|--------|------|------|--------|
| `GET` | `/api/qr` | — | ✅ Implemented |
| `GET` | `/api/qr/status` | — | ✅ Implemented |
| `POST` | `/api/qr` | 🔒 | ✅ Implemented |
| `DELETE` | `/api/qr` | 🔒 | ✅ Implemented |
| `POST` | `/api/chat` | 🔒 | ✅ Implemented |
| `GET` | `/api/dashboard/stats` | — | ❌ Belum di-backend |
| `GET` | `/api/products` | — | ❌ Belum di-backend |
| `GET` | `/api/products/:id` | — | ❌ Belum di-backend |
| `POST` | `/api/products` | 🔒 | ❌ Belum di-backend |
| `PUT` | `/api/products/:id` | 🔒 | ❌ Belum di-backend |
| `DELETE` | `/api/products/:id` | 🔒 | ❌ Belum di-backend |
| `GET` | `/api/products/categories` | — | ❌ Belum di-backend |
| `POST` | `/api/products/categories` | 🔒 | ❌ Belum di-backend |
| `PUT` | `/api/products/categories/:id` | 🔒 | ❌ Belum di-backend |
| `DELETE` | `/api/products/categories/:id` | 🔒 | ❌ Belum di-backend |
| `GET` | `/api/orders` | — | ❌ Belum di-backend |
| `GET` | `/api/orders/:id` | — | ❌ Belum di-backend |
| `PUT` | `/api/orders/:id/status` | 🔒 | ❌ Belum di-backend |
| `PUT` | `/api/orders/:id/notes` | 🔒 | ❌ Belum di-backend |
| `PUT` | `/api/orders/:id/payment` | 🔒 | ❌ Belum di-backend |
| `GET` | `/api/customers` | — | ❌ Belum di-backend |
| `GET` | `/api/customers/:id` | — | ❌ Belum di-backend |
| `PUT` | `/api/customers/:id` | 🔒 | ❌ Belum di-backend |
| `GET` | `/api/conversations` | — | ❌ Belum di-backend |
| `GET` | `/api/conversations/:id` | — | ❌ Belum di-backend |
| `PUT` | `/api/conversations/:id/status` | 🔒 | ❌ Belum di-backend |
| `POST` | `/api/conversations/:id/messages` | 🔒 | ❌ Belum di-backend |
| `GET` | `/api/store` | — | ❌ Belum di-backend |
| `PUT` | `/api/store` | 🔒 | ❌ Belum di-backend |
| `GET` | `/api/ai-config` | — | ❌ Belum di-backend |
| `PUT` | `/api/ai-config` | 🔒 | ❌ Belum di-backend |
| `GET` | `/api/qr/settings` | — | ❌ Belum di-backend |
| `POST` | `/api/qr/disconnect` | 🔒 | ❌ Belum di-backend |
| `POST` | `/api/auth/register` | — | ❌ Belum di-backend |
| `POST` | `/api/auth/login` | — | ❌ Belum di-backend |
| `GET` | `/api/auth/me` | 🔒 | ❌ Belum di-backend |
| `POST` | `/api/auth/logout` | 🔒 | ❌ Belum di-backend |
| `POST` | `/api/auth/forgot-password` | — | ❌ Belum di-backend |
| `POST` | `/api/auth/reset-password` | — | ❌ Belum di-backend |
| `GET` | `/api/logs` | — | ❌ Belum di-backend |
| `GET` | `/api/usage` | — | ❌ Belum di-backend |

---

> **Catatan Implementasi**: Semua endpoint bertanda ❌ sudah memiliki mock data di dashboard
> (`hooks/*.ts` dengan `MOCK = true`) tapi belum ada route/controller di backend API.
> Prioritas implementasi sesuai roadmap: QR → Products → Orders → Customers → Settings.
