# WANI API — Specification

> REST API untuk platform WANI. Base URL: `http://localhost:3001/api`

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

## 9. Error Codes

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
| `GET` | `/api/qr` | — | ✅ Existing |
| `GET` | `/api/qr/status` | — | ✅ Existing |
| `POST` | `/api/qr` | 🔒 | ✅ Existing |
| `DELETE` | `/api/qr` | 🔒 | ✅ Existing |
| `GET` | `/api/dashboard/stats` | — | 📋 Planned |
| `GET` | `/api/products` | — | 📋 Planned |
| `GET` | `/api/products/:id` | — | 📋 Planned |
| `POST` | `/api/products` | 🔒 | 📋 Planned |
| `PUT` | `/api/products/:id` | 🔒 | 📋 Planned |
| `DELETE` | `/api/products/:id` | 🔒 | 📋 Planned |
| `GET` | `/api/products/categories` | — | 📋 Planned |
| `POST` | `/api/products/categories` | 🔒 | 📋 Planned |
| `PUT` | `/api/products/categories/:id` | 🔒 | 📋 Planned |
| `DELETE` | `/api/products/categories/:id` | 🔒 | 📋 Planned |
| `GET` | `/api/orders` | — | 📋 Planned |
| `GET` | `/api/orders/:id` | — | 📋 Planned |
| `PUT` | `/api/orders/:id/status` | 🔒 | 📋 Planned |
| `PUT` | `/api/orders/:id/notes` | 🔒 | 📋 Planned |
| `PUT` | `/api/orders/:id/payment` | 🔒 | 📋 Planned |
| `GET` | `/api/customers` | — | 📋 Planned |
| `GET` | `/api/customers/:id` | — | 📋 Planned |
| `PUT` | `/api/customers/:id` | 🔒 | 📋 Planned |
| `GET` | `/api/conversations` | — | 📋 Planned | Consumed via Customers page |
| `GET` | `/api/conversations/:id` | — | 📋 Planned | Consumed via Customers page |
| `PUT` | `/api/conversations/:id/status` | 🔒 | 📋 Planned | Consumed via Customers page |
| `POST` | `/api/conversations/:id/messages` | 🔒 | 📋 Planned | Consumed via Customers page |
| `GET` | `/api/store` | — | 📋 Planned | Settings tab: Store |
| `PUT` | `/api/store` | 🔒 | 📋 Planned | Settings tab: Store |
| `GET` | `/api/ai-config` | — | 📋 Planned | Settings tab: AI Agent |
| `PUT` | `/api/ai-config` | 🔒 | 📋 Planned | Settings tab: AI Agent |
| `GET` | `/api/qr/settings` | — | 📋 Planned | Settings tab: WA Session |
| `POST` | `/api/qr/disconnect` | 🔒 | 📋 Planned | Settings tab: WA Session |
| `GET` | `/api/logs` | — | 📋 Planned |
| `GET` | `/api/usage` | — | 📋 Planned |

---

> **Catatan Implementasi**: Endpoint dibagi sesuai 5 halaman dashboard: Dashboard (QR + stats), Products, Orders, Customers (dengan chat inline), Settings (Store + AI + WA). Semua endpoint baru sebaiknya tanpa auth dulu untuk development.
