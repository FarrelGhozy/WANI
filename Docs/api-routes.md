# API Routes

Base URL: `/api`

## Response Format

```json
{ "success": true, "data": { ... } }
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 10, "total": 47, "totalPages": 5 } }
{ "success": false, "error": "message" }
```

## Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new merchant |
| POST | `/auth/login` | No | Login, returns JWT + httpOnly cookie |
| POST | `/auth/logout` | No | Clear auth cookie |

## Merchants

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/merchants/me` | Yes | Get current merchant profile |
| PUT | `/merchants/me` | Yes | Update profile (businessName, address, phone) |
| GET | `/merchants/me/stats` | Yes | Get merchant stats |

## Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | Yes | List (paginated, filterable by categoryId, isAvailable) |
| POST | `/products` | Yes | Create product |
| GET | `/products/:id` | Yes | Get by ID |
| PUT | `/products/:id` | Yes | Update product |
| DELETE | `/products/:id` | Yes | Delete product |

## Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | Yes | List categories |
| POST | `/categories` | Yes | Create category |
| PUT | `/categories/:id` | Yes | Update category |
| DELETE | `/categories/:id` | Yes | Delete category |

## Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/orders` | Yes | List (paginated, filterable by status, date range) |
| GET | `/orders/:id` | Yes | Get order with items |
| PUT | `/orders/:id/status` | Yes | Update status (validates state machine) |

## Customers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/customers` | Yes | List (paginated, searchable by name/phone) |
| GET | `/customers/:id` | Yes | Get with order history |

## Conversations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/conversations` | Yes | List (paginated) |
| GET | `/conversations/:id/messages` | Yes | Get messages |
| GET | `/conversations/:id/messages?page=1` | Yes | Paginated messages |

## Web Store

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/web-store/:merchantId` | Yes | Get web store config |
| PUT | `/web-store/:merchantId` | Yes | Update store (slug, template, SEO, hero, theme) |
| POST | `/web-store/:merchantId/publish` | Yes | Publish store |
| POST | `/web-store/:merchantId/unpublish` | Yes | Unpublish store |
| GET | `/templates` | Yes | List available templates |
| GET | `/templates/:name` | Yes | Get template details |
| GET | `/web-store/public/:slug` | No | Public store data + rendered theme |

## WA Session

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wa-session/status` | Yes | Connection status + QR if available |
| GET | `/wa-session/qr` | Yes | QR code as PNG |
| POST | `/wa-session/logout` | Yes | Disconnect session |
| POST | `/wa-session/restart` | Yes | Restart connection |

## Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/stats` | Yes | Overview stats (orders, revenue, customers, products) |
| GET | `/dashboard/stats/revenue` | Yes | Revenue data with daily breakdown |

## Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/settings` | Yes | List key-value settings |
| PUT | `/settings` | Yes | Batch update settings |

## AI Agent

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ai-agent/me` | Yes | Get AI agent config |
| PUT | `/ai-agent/me` | Yes | Upsert AI agent |
| POST | `/ai-agent/me/toggle` | Yes | Enable/disable AI agent |

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |

## Auth

All protected endpoints require the JWT token sent as an httpOnly cookie (`token`) or `Authorization: Bearer <token>` header. Token is obtained from login/register.
