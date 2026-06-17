# WANI API Documentation

## Base URL
Development: `http://localhost:3001/api`

## Authentication
All endpoints except login/register require `Authorization: Bearer <token>` header.
Token obtained from `POST /api/auth/login` or `POST /api/auth/register`.

### Response Format
```json
{ "success": true, "data": { ... } }
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 10, "total": 47, "totalPages": 5 } }
{ "success": false, "error": "message" }
```

---

## Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new merchant |
| POST | `/auth/login` | Login, returns JWT + sets httpOnly cookie |
| POST | `/auth/logout` | Clear auth cookie |

## Merchants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/merchants/me` | Get current merchant profile |
| PUT | `/merchants/me` | Update merchant profile (businessName, address, phone) |
| PUT | `/merchants/me/password` | Change password |

## AI Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-agent/me` | Get AI agent config |
| PUT | `/ai-agent/me` | Upsert AI agent (systemPrompt, greetingMessage, knowledgeBase) |

## Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (paginated, filterable by categoryId, isAvailable) |
| POST | `/products` | Create product |
| GET | `/products/:id` | Get product by ID |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

## Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List categories with product count |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category (fails if has products) |

## Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List orders (paginated, filterable by status, date range) |
| PUT | `/orders/:id/status` | Update order status (validates state machine transitions) |
| GET | `/orders/:id` | Get order with items |

## Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List customers (paginated, searchable by name/phone) |
| GET | `/customers/:id` | Get customer with order history |

## Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations` | List conversations (paginated) |
| GET | `/conversations/:id/messages` | Get messages for a conversation |

## Web Store
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/web-store/:merchantId` | Get web store config |
| PUT | `/web-store/:merchantId` | Update web store (slug, template, SEO, hero, theme) |
| POST | `/web-store/:merchantId/publish` | Publish store |
| POST | `/web-store/:merchantId/unpublish` | Unpublish store |
| GET | `/web-store/public/:slug` | Get public store data (no auth) + rendered theme |
| GET | `/templates` | List available templates |
| GET | `/templates/:name` | Get template details |

## WA Session
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wa-session/status` | Get connection status and QR if available |
| GET | `/wa-session/qr` | Get QR code as PNG |
| POST | `/wa-session/logout` | Disconnect session |
| POST | `/wa-session/restart` | Restart connection |

## Dashboard Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Get overview stats (orders count, revenue, customers, products) |
| GET | `/dashboard/stats/revenue` | Get revenue data (period, daily breakdown) |

## Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | List settings (key-value pairs) |
| PUT | `/settings` | Batch update settings |

## Validation Schemas (Zod)
All input validation uses centralized schemas in `src/lib/validation.ts`:
- `registerSchema`, `loginSchema`, `updateMerchantSchema`
- `createProductSchema`, `updateProductSchema`
- `createCategorySchema`, `updateCategorySchema`
- `updateOrderStatusSchema`
- `createCustomerSchema`
- `updateAiAgentSchema`
- `updateWebStoreSchema`
- `dashboardStatsQuerySchema`
- `paginationSchema`
- `conversationMessageSchema`
