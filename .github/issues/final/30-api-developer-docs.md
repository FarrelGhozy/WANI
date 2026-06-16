# FIN-30 — API Documentation + Developer Documentation

## Deskripsi
Lengkapi semua dokumentasi developer: API reference, architecture deep-dive, dan contributing guide.

## Task Checklist

### 1. API Documentation (`Docs/API.md`)
Dokumentasi lengkap semua REST API endpoints:

```
# WANI API Documentation

## Base URL
Development: http://localhost:3001/api
Production: https://api.wani.my.id/api

## Authentication
Semua endpoint selain /health, /auth/*, dan /web-store/public/* memerlukan JWT token.

### Headers
Authorization: Bearer <token>

### Response Format
{
  "success": true | false,
  "data": { ... },
  "error": "message"  // hanya jika success = false
}

### Pagination
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "totalPages": 5
  }
}
```

#### Auth
- [ ] `POST /api/auth/register` — request/response example
- [ ] `POST /api/auth/login` — request/response example

#### Merchant
- [ ] `GET /api/merchants/me`
- [ ] `PUT /api/merchants/me`
- [ ] `GET /api/merchants/me/stats`

#### Products
- [ ] `GET /api/products` — with query params (search, category, status, page, limit)
- [ ] `POST /api/products` — request body schema
- [ ] `PUT /api/products/:id`
- [ ] `DELETE /api/products/:id`

#### Orders
- [ ] `GET /api/orders` — with query params (status, source, date range)
- [ ] `GET /api/orders/:id`
- [ ] `PUT /api/orders/:id/status` — valid transitions

#### Conversations
- [ ] `GET /api/conversations`
- [ ] `GET /api/conversations/:id`
- [ ] `GET /api/conversations/:id/messages`
- [ ] `POST /api/conversations/:id/messages`

#### AI Agent
- [ ] `GET /api/ai-agent/:merchantId`
- [ ] `PUT /api/ai-agent/:merchantId`
- [ ] `POST /api/ai-agent/:merchantId/toggle`

#### Web Store
- [ ] `GET /api/web-store/:merchantId`
- [ ] `PUT /api/web-store/:merchantId`
- [ ] `POST /api/web-store/:merchantId/publish`
- [ ] `POST /api/web-store/:merchantId/unpublish`
- [ ] `GET /api/web-store/public/:slug` (no auth)

#### Dashboard
- [ ] `GET /api/dashboard/stats`
- [ ] `GET /api/dashboard/recent-orders`
- [ ] `GET /api/dashboard/activity`

#### WA Session
- [ ] `GET /api/wa-session/:merchantId/status`
- [ ] `POST /api/wa-session/:merchantId/connect`
- [ ] `GET /api/wa-session/:merchantId/qr`
- [ ] `POST /api/wa-session/:merchantId/disconnect`

### 2. Error Codes Reference
```typescript
// Format error response
{
  "success": false,
  "error": "Validation error",
  "details": [
    { "field": "phone", "message": "Nomor WA harus diawali 62" }
  ]
}

// HTTP Status Codes
200 - Success
201 - Created
400 - Bad Request (validasi error)
401 - Unauthorized (token invalid)
404 - Not Found
409 - Conflict (duplicate)
429 - Too Many Requests (rate limit)
500 - Internal Server Error
```

### 3. Developer Setup (`Docs/GETTING-STARTED.md`)
- [ ] Prerequisites (Node.js 20+, pnpm 9+, Docker)
- [ ] Clone & install
- [ ] Environment variables
- [ ] Database setup & migration
- [ ] Run development servers
- [ ] Testing
- [ ] Common issues & solutions

### 4. Architecture Deep-Dive (`Docs/ARCHITECTURE-DEEP-DIVE.md`)
- [ ] Component architecture diagram
- [ ] Data flow: incoming WA message → response
- [ ] Data flow: Web Store request → response
- [ ] Order state machine detail
- [ ] Baileys reconnection strategy detail
- [ ] AI pipeline fallback chain
- [ ] Database indexing strategy

### 5. Contributing Guide (`Docs/CONTRIBUTING.md`)
- [ ] Branch strategy
- [ ] Commit message format (conventional commits)
- [ ] PR process
- [ ] Coding standards
- [ ] Test requirements

## Verification
- [ ] Semua endpoint terdocumentasi dengan request/response example
- [ ] Developer bisa setup project hanya dengan mengikuti GETTING-STARTED.md
- [ ] Architecture flow jelas

## Labels
`documentation`, 🟡 medium

## Dependencies
Semua API issues selesai

## Estimasi
1-2 hari
