# WANI — Project Architecture

> **WANI** (WA + Niaga) — Platform open-source untuk menghidupkan WhatsApp UMKM dengan AI-powered customer service.
> Tagline: *"Berani Digital. WA Niaga untuk UMKM."*

---

## 📋 Overview

WANI adalah platform yang mengubah WhatsApp UMKM dari sekadar "papan pengumuman" menjadi **sistem bisnis hidup** — AI CS otomatis, order management, dan integrasi kasir. Pelanggan chat WA biasa, AI yang handle via LLM, order langsung tercatat dengan integritas data penuh.

**Data integrity is non-negotiable** — itulah kenapa kita pake PostgreSQL + Prisma ORM.

---

## 🛠️ Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Runtime** | Node.js 20+ (Express) | Familiar, ringan, satu ekosistem |
| **Database** | **PostgreSQL 16** ✅ | ACID buat data uang & order, JSONB fleksibel buat chat |
| **ORM** | **Prisma** ✅ | Type-safe, migration auto, relation built-in |
| **WA Engine** | **Baileys** ✅ | Library langsung, ringan, kontrol penuh |
| **Session WA** | PostgreSQL (encrypted) | Auth creds disimpan aman di DB |
| **AI/LLM** | OpenRouter / DeepSeek | Free tier, multi-model, OpenAI-compatible |
| **Dashboard** | Next.js / EJS | Nanti belakangan, prioritas backend dulu |
| **Auth** | JWT + WA OTP | Simple, no email, cocok UMKM |
| **Logging** | **Pino** + ActivityLog DB | Structured logging + audit trail |
| **Deploy** | **Docker Compose** 🐳 | 3 service: WANI + PostgreSQL + (opsional Redis) |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     WANI APP (Node.js)                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                   Baileys Manager                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │
│  │  │ Socket   │  │  Auth    │  │ Reconnect│             │    │
│  │  │ Manager  │──│ Store    │──│ Engine   │             │    │
│  │  └────┬─────┘  └──────────┘  └──────────┘             │    │
│  └───────┼───────────────────────────────────────────────┘    │
│          │ messages.upsert event                               │
│          ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                Message Pipeline                        │    │
│  │                                                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐  │    │
│  │  │  Router  │──│  LLM     │──│ Validate │──│Action│  │    │
│  │  │(dedup +  │  │(parse +  │  │(JSON     │  │Exec  │  │    │
│  │  │ classify)│  │ intent)  │  │ schema)  │  │      │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────┘  │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Error Handling Layer                      │    │
│  │  ├── ActivityLog (semua event tercatat)                │    │
│  │  ├── Graceful Degradation (mode offline)               │    │
│  │  ├── Human Escalation (AI → admin)                     │    │
│  │  └── Circuit Breaker (LLM down → fallback reply)      │    │
│  └───────────────────────────────────────────────────────┘    │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    ▼              ▼
           ┌────────────┐  ┌──────────────┐
           │ PostgreSQL │  │  REST API    │
           │  + Prisma  │  │  (Dashboard) │
           └────────────┘  └──────────────┘
```

---

## 🗄️ Database Design (PostgreSQL + Prisma)

### Entity Relationship

```
MERCHANT 1──N CUSTOMER
MERCHANT 1──N PRODUCT
MERCHANT 1──N CATEGORY
MERCHANT 1──N ORDER
MERCHANT 1──N CONVERSATION
MERCHANT 1──1 AI_AGENT
MERCHANT 1──N SETTING
MERCHANT 1──N ACTIVITY_LOG
CUSTOMER 1──N ORDER
CUSTOMER 1──N CONVERSATION
CATEGORY 1──N PRODUCT
ORDER    1──N ORDER_ITEM
ORDER    1──1 PAYMENT
PRODUCT  1──N ORDER_ITEM
CONVERSATION 1──N MESSAGE
```

### Full Prisma Schema

```prisma
// ─── Enums ─────────────────────────────────────────────

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  COMPLETED
  CANCELLED
}

enum PaymentMethod {
  CASH
  TRANSFER
  QRIS
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum MessageRole {
  CUSTOMER
  BOT
  HUMAN
}

enum ConversationStatus {
  ACTIVE
  RESOLVED
  ARCHIVED
  ESCALATED
}

// ─── Core Business ──────────────────────────────────────

model Merchant {
  id           String   @id @default(uuid())
  businessName String   @map("business_name")
  phone        String   @unique
  address      String?
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  customers     Customer[]
  products      Product[]
  categories    Category[]
  orders        Order[]
  conversations Conversation[]
  aiAgent       AIAgent?
  settings      Setting[]
  activityLogs  ActivityLog[]
  waSession     WaSession?

  @@map("merchants")
}

model Customer {
  id          String   @id @default(uuid())
  merchantId  String   @map("merchant_id")
  name        String
  phone       String   @unique // WA number
  notes       String?
  totalOrders Int      @default(0) @map("total_orders")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  merchant      Merchant       @relation(fields: [merchantId], references: [id])
  orders        Order[]
  conversations Conversation[]

  @@unique([merchantId, phone])
  @@map("customers")
}

model Category {
  id          String   @id @default(uuid())
  merchantId  String   @map("merchant_id")
  name        String
  description String?

  merchant Merchant  @relation(fields: [merchantId], references: [id])
  products Product[]

  @@unique([merchantId, name])
  @@map("categories")
}

model Product {
  id          String   @id @default(uuid())
  merchantId  String   @map("merchant_id")
  categoryId  String?  @map("category_id")
  name        String
  description String?
  price       Decimal  @db.Decimal(12,2)
  stock       Int      @default(0)
  isAvailable Boolean  @default(true) @map("is_available")
  imageUrl    String?  @map("image_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  merchant   Merchant    @relation(fields: [merchantId], references: [id])
  category   Category?   @relation(fields: [categoryId], references: [id])
  orderItems OrderItem[]
  @@index([merchantId])
  @@map("products")
}

// ─── Order & Payment ────────────────────────────────────

model Order {
  id          String      @id @default(uuid())
  merchantId  String      @map("merchant_id")
  customerId  String      @map("customer_id")
  status      OrderStatus @default(PENDING)
  totalAmount Decimal     @default(0) @db.Decimal(12,2) @map("total_amount")
  source      String      @default("wa_chat")
  notes       String?
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  merchant Merchant  @relation(fields: [merchantId], references: [id])
  customer Customer  @relation(fields: [customerId], references: [id])
  items    OrderItem[]
  payment  Payment?

  @@index([merchantId])
  @@index([customerId])
  @@map("orders")
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String  @map("order_id")
  productId String  @map("product_id")
  qty       Int
  unitPrice Decimal @db.Decimal(12,2) @map("unit_price")
  subtotal  Decimal @db.Decimal(12,2)

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model Payment {
  id        String         @id @default(uuid())
  orderId   String         @unique @map("order_id")
  method    PaymentMethod?
  amount    Decimal        @db.Decimal(12,2)
  status    PaymentStatus  @default(PENDING)
  paidAt    DateTime?      @map("paid_at")
  createdAt DateTime       @default(now()) @map("created_at")

  order Order @relation(fields: [orderId], references: [id])

  @@map("payments")
}

// ─── WhatsApp & Chat ─────────────────────────────────────

model Conversation {
  id            String             @id @default(uuid())
  merchantId    String             @map("merchant_id")
  customerId    String             @map("customer_id")
  status        ConversationStatus @default(ACTIVE)
  lastMessageAt DateTime?          @map("last_message_at")
  createdAt     DateTime           @default(now()) @map("created_at")
  updatedAt     DateTime           @updatedAt @map("updated_at")

  merchant Merchant @relation(fields: [merchantId], references: [id])
  customer Customer @relation(fields: [customerId], references: [id])
  messages Message[]

  @@index([merchantId, status])
  @@index([customerId])
  @@map("conversations")
}

model Message {
  id             String       @id @default(uuid())
  conversationId String       @map("conversation_id")
  role           MessageRole
  content        String       @db.Text
  msgType        String       @default("text") @map("msg_type") // text, image, order, template
  metadata       Json?        // JSONB - LLM context, AI response raw, dll
  createdAt      DateTime     @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@index([conversationId, createdAt])
  @@map("messages")
}

model WaSession {
  id         String   @id @default(uuid())
  merchantId String   @unique @map("merchant_id")
  creds      Json?    // 🔐 Auth credentials (encrypted before stored)
  status     String   @default("disconnected") // disconnected, connecting, connected, expired
  qrCode     String?  @map("qr_code") // QR terakhir (base64)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  merchant Merchant @relation(fields: [merchantId], references: [id])

  @@map("wa_sessions")
}

// ─── AI & Settings ──────────────────────────────────────

model AIAgent {
  id              String   @id @default(uuid())
  merchantId      String   @unique @map("merchant_id")
  isActive        Boolean  @default(true) @map("is_active")
  systemPrompt    String   @db.Text @map("system_prompt")
  model           String   @default("opencode/deepseek-v4-flash-free")
  greetingMessage String?  @map("greeting_message")
  knowledgeBase   String?  @db.Text @map("knowledge_base") // info toko: jam, aturan, FAQ
  maxTokens       Int      @default(2048) @map("max_tokens") // cost control
  temperature     Decimal  @default(0.7) @db.Decimal(3,2)
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  merchant Merchant @relation(fields: [merchantId], references: [id])

  @@map("ai_agents")
}

model Setting {
  id         String   @id @default(uuid())
  merchantId String   @map("merchant_id")
  key        String   // currency, timezone, wa_number, business_hours, dll
  value      Json?    // JSONB - flexible
  updatedAt  DateTime @updatedAt @map("updated_at")

  merchant Merchant @relation(fields: [merchantId], references: [id])

  @@unique([merchantId, key])
  @@map("settings")
}

// ─── Audit ───────────────────────────────────────────────

model ActivityLog {
  id          String   @id @default(uuid())
  merchantId  String   @map("merchant_id")
  type        String   // order_created, wa_sent, wa_received, error, escalation,
                       // payment_received, ai_response, session_expired, human_reply
  referenceId String?  @map("reference_id") // ID order/conversation terkait
  description String   @db.Text
  metadata    Json?    // JSONB - LLM raw response, error stack, dll
  createdAt   DateTime @default(now()) @map("created_at")

  merchant Merchant @relation(fields: [merchantId], references: [id])

  @@index([merchantId, createdAt])
  @@map("activity_logs")
)
```

### Kenapa PostgreSQL + Prisma?

| Requirement | Solusi |
|-------------|--------|
| **Data uang ga boleh error** | ✅ ACID transaction — kalo order gagal di tengah, rollback semua |
| **Foreign key integrity** | ✅ Ngga mungkin ada OrderItem tanpa Order |
| **Chat messages flexible** | ✅ JSONB column — metadata tetap bisa query & index |
| **Migration aman** | ✅ Prisma migrate — rollback, versioning, type-safe |
| **Umkm scale (ribuan chat/hari)** | ✅ PostgreSQL handle dengan mudah |
| **Backup & restore** | ✅ pg_dump / pg_restore — mature banget |

---

## 📁 Directory Structure (Final)

```
WANI/
│
├── server.js                   # Entry point (Express + Baileys init)
├── package.json
├── tsconfig.json               # TypeScript
├── .env.example
├── docker-compose.yml          # 🐳 Final deploy
├── Dockerfile
├── .dockerignore
│
├── prisma/
│   ├── schema.prisma           # Full DB schema
│   └── seed.ts                 # Data awal (demo merchant)
│
├── src/
│   ├── config/
│   │   ├── index.ts            # Env config loader
│   │   └── prisma.ts           # Prisma client singleton
│   │
│   ├── baileys/                 # ─── WhatsApp Engine ───
│   │   ├── manager.ts          # Connection state machine (connect/reconnect/disconnect)
│   │   ├── auth.ts             # Session save/load + encrypt/decrypt
│   │   ├── handlers.ts         # messages.upsert, presence.update, etc
│   │   ├── sender.ts           # sendText, sendImage, sendInvoice
│   │   └── types.ts            # Baileys event types
│   │
│   ├── ai/                      # ─── AI/LLM Engine ───
│   │   ├── engine.ts           # OpenRouter API caller, retry, fallback
│   │   ├── prompts.ts          # System prompt templates
│   │   ├── schemas.ts          # JSON output schemas (order, inquiry, etc)
│   │   └── validator.ts        # Validate LLM output sebelum eksekusi
│   │
│   ├── pipeline/                # ─── Message Pipeline ───
│   │   ├── router.ts           # Incoming message → dedup → classify → route
│   │   ├── intent-classifier.ts # LLM intent detection
│   │   ├── order-parser.ts     # OrderIntent → Order object
│   │   ├── inquiry-handler.ts  # Inquiry → search product → reply
│   │   └── escalation.ts       # Human escalation flow
│   │
│   ├── services/                # ─── Business Logic ───
│   │   ├── merchant.service.ts
│   │   ├── customer.service.ts
│   │   ├── product.service.ts
│   │   ├── order.service.ts     # + state machine transitions
│   │   ├── payment.service.ts
│   │   ├── conversation.service.ts
│   │   └── ai-agent.service.ts
│   │
│   ├── routes/                  # ─── REST API ───
│   │   ├── index.ts            # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── merchants.routes.ts
│   │   ├── customers.routes.ts
│   │   ├── products.routes.ts
│   │   ├── orders.routes.ts
│   │   ├── conversations.routes.ts
│   │   └── health.routes.ts    # Healthcheck endpoint
│   │
│   ├── middleware/
│   │   ├── auth.ts             # JWT verification
│   │   ├── error-handler.ts    # Global error handler
│   │   ├── validator.ts        # Request validation (zod)
│   │   └── rate-limit.ts       # Rate limiting
│   │
│   ├── utils/
│   │   ├── logger.ts           # Pino structured logger
│   │   ├── wa-formatter.ts     # Format WA messages
│   │   └── helpers.ts
│   │
│   └── types/
│       └── index.ts            # Shared TypeScript types
│
├── tests/
│   ├── unit/
│   │   ├── order-parser.test.ts
│   │   ├── ai-validator.test.ts
│   │   └── state-machine.test.ts
│   └── integration/
│       ├── baileys-mock.test.ts
│       └── api.test.ts
│
└── public/                     # (Future: dashboard frontend)
```

---

## 🔌 Baileys Connection Manager

Ini adalah komponen paling kritis — koneksi WA harus hidup 24/7.

### State Machine

```
        ┌──────────────┐
        │  DISCONNECTED │
        └──────┬───────┘
               │ connect()
               ▼
        ┌──────────────┐
        │  CONNECTING   │ ← ─ ─ ─ ─ ─ ─ ┐
        └──────┬───────┘                 │ retry
               │ QR scanned / auth loaded │ (exponential
               ▼                          │  backoff)
        ┌──────────────┐                 │
        │  CONNECTED    │─────────────────┘
        └──────┬───────┘   disconnected event
               │
         ┌─────┴──────┐
         │            │
         ▼            ▼
   ┌──────────┐  ┌──────────┐
   │  EXPIRED  │  │ RECONNECT│
   │(rescan QR)│  │ (auto)   │
   └──────────┘  └──────────┘
```

### Reconnection Strategy (Exponential Backoff)

```
Attempt 1:  wait 1s
Attempt 2:  wait 5s
Attempt 3:  wait 15s
Attempt 4:  wait 30s
Attempt 5+: wait 60s (max)
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
After 10 retries → mark session EXPIRED
→ Notify merchant via Web Dashboard
→ But still retry every 5 menit
```

### Session Auth Flow

```
Save:   Baileys auth creds → encrypt (AES-256) → store to WaSession.creds (JSONB)
Load:   Read WaSession.creds → decrypt → inject ke Baileys socket
First:  No session → generate QR → save to WaSession.qrCode → show to merchant
```

---

## 🧠 AI/LLM Pipeline

### System Prompt Template

```
Kamu adalah AI Customer Service untuk {{business_name}}.
Gunakan bahasa Indonesia yang sopan dan ramah.

=== INFO TOKO ===
{{knowledge_base}}

=== PRODUK TERSEDIA ===
{{product_list}}

=== ATURAN ===
1. Jika customer ingin pesan, keluarkan JSON ORDER
2. Jika customer tanya harga/produk, jawab dari daftar produk
3. Jika customer marah/komplain, minta maaf dan escalation
4. JANGAN pernah mengarang produk yang tidak ada di daftar
5. JANGAN pernah memberikan informasi harga yang salah

=== FORMAT OUTPUT ===
Untuk order, gunakan format JSON berikut:
{
  "intent": "order",
  "items": [{"name": "...", "qty": N}],
  "notes": "..."
}

Untuk pertanyaan biasa, reply natural dalam Bahasa Indonesia.
```

### Intent Classification & JSON Output

```typescript
// LLM akan return salah satu dari:
type LLMOutput =
  | { intent: "order";     items: OrderItemInput[]; notes?: string }
  | { intent: "inquiry";   query: string }
  | { intent: "greeting";  reply: string }
  | { intent: "complaint"; reply: string }
  | { intent: "unknown";   reply: string }
  | { intent: "escalate";  reason: string }
```

### Validation Layer (sebelum eksekusi)

Setiap output LLM harus divalidasi:

```typescript
function validateOrderOutput(output: LLMOutput): ValidationResult {
  // 1. Apakah format JSON valid?
  // 2. Apakah intent yang dimaksud?
  // 3. Kalo ORDER:
  //    a. Semua produk ada di database?
  //    b. Stok cukup?
  //    c. Item tidak kosong?
  // 4. Kalo INQUIRY:
  //    a. Apakah produk yang ditanyakan ada?
  // 5. Kalo GAGAL validasi:
  //    → Jangan eksekusi!
  //    → Minta LLM ulang dengan konteks error
  //    → Max 2 retry, kalo gagal → fallback reply
}
```

### Fallback Chain (kalo LLM bermasalah)

```
1. Primary:   OpenRouter → deepseek-v4-flash-free
2. Fallback:  OpenRouter → gemini-2.0-flash (free)
3. Offline:   "Maaf kak, sistem sedang sibuk. Silakan coba lagi nanti."
```

---

## 📋 Order State Machine

```mermaid
statusDiagram
    [*] --> PENDING      : AI terima order dari WA
    PENDING --> CONFIRMED : Merchant konfirmasi (auto/manual)
    PENDING --> CANCELLED : Customer batal
    CONFIRMED --> PROCESSING : Merchant mulai proses
    CONFIRMED --> CANCELLED  : Batal
    PROCESSING --> COMPLETED : Selesai
    PROCESSING --> CANCELLED : Gagal diproses
```

### Trigger tiap transisi:

| Dari | Ke | Trigger | Siapa |
|------|----|---------|-------|
| PENDING | CONFIRMED | Auto (trusted customer) / Manual (merchant) | AI / Merchant |
| PENDING | CANCELLED | "kak saya batalkan pesanannya" | Customer via AI |
| CONFIRMED | PROCESSING | Dashboard / WA admin | Merchant |
| CONFIRMED | CANCELLED | Stock habis / customer batal | Merchant |
| PROCESSING | COMPLETED | Barang siap | Merchant |
| PROCESSING | CANCELLED | Gagal diproses | Merchant |

### ACID Transaction (Prisma)

```typescript
const [order] = await prisma.$transaction([
  // 1. Create order
  prisma.order.create({ data: { ... } }),
  // 2. Kurangi stock
  prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: qty } }
  }),
  // 3. Update total_orders customer
  prisma.customer.update({
    where: { id: customerId },
    data: { totalOrders: { increment: 1 } }
  }),
  // 4. Log activity
  prisma.activityLog.create({ data: { ... } })
]);
// ✅ Jika salah satu gagal, SEMUA di-rollback
```

---

## 👤 Human Escalation Flow

Tidak semua percakapan bisa di-handle AI. Ini flow escalation:

```
[Customer ngomplang / minta refund / request aneh]
         │
         ▼
AI detects: confidence < 70% → "Maaf kak, saya hubungkan ke admin..."
         │
         ▼
1. Conversation.status → ESCALATED
2. AI → readonly mode (jangan jawab lagi)
3. Kirim ringkasan ke WA Merchant:
   "📞 ESCALATION: Pelanggan Ani meminta refund untuk pesanan #123"
4. Semua balasan Merchant → forward langsung ke Customer
         │
         ▼
[Merchant selesai handle]
         │
         ▼
5. Conversation.status → RESOLVED
6. AI bisa jawab lagi kalo customer chat baru
```

---

## 🧪 Testing Strategy

| Level | Tools | Apa yang di-test |
|-------|-------|------------------|
| **Unit** | Vitest / Jest | order-parser, AI validator, state machine |
| **Integration** | Supertest | API endpoints, Prisma queries |
| **Baileys Mock** | Custom MockSocket | Message pipeline tanpa WA real |
| **LLM Mock** | Nock / MSW | AI engine tanpa API call real |

---

## 🐳 Docker Compose (Final)

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: wani-db
    restart: unless-stopped
    volumes:
      - pg_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: wani
      POSTGRES_USER: wani
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wani"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - wani-net

  wani:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: wani-app
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"
    volumes:
      - wani_media:/app/public/uploads
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://wani:${DB_PASSWORD}@postgres:5432/wani
      OPENROUTER_API_KEY: ${OP...Y}
      JWT_SECRET: ${JWT_SECRET}
      WA_PHONE: ${WA_PHONE}
      LOG_LEVEL: info
    networks:
      - wani-net

volumes:
  pg_data:
  wani_media:

networks:
  wani-net:
    driver: bridge
```

### Dockerfile (Multi-stage)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
```

### Cara Install (24/7 production):

```bash
# 1. Clone
git clone https://github.com/FarrelGhozy/WANI.git
cd WANI

# 2. Setup
cp .env.example .env
nano .env    # Isi: DB_PASSWORD, OPENROUTER_API_KEY, JWT_SECRET, WA_PHONE

# 3. Deploy
docker compose up -d

# 4. Lihat QR (first time)
docker compose logs -f wani
# Scan QR dari WhatsApp > Linked Devices

# 5. Cek health
curl http://localhost:3000/health
# → {"status":"ok","db":"connected","wa":"connected","uptime":3600}
```

---

## 📈 Milestone

| Phase | Target | Deliverable |
|-------|--------|-------------|
| **P1** | Minggu 1-2 | **Foundation**: Express + Prisma + PostgreSQL + Auth JWT |
| **P2** | Minggu 3 | **Baileys**: Connection manager, session, send/receive |
| **P3** | Minggu 4 | **AI Engine**: LLM integration, intent parser, order parsing |
| **P4** | Minggu 5 | **Business Logic**: Order CRUD, state machine, stock, payment |
| **P5** | Minggu 6 | **Pipeline**: Message router → AI → validate → execute → reply |
| **P6** | Minggu 7 | **Polish**: Error handling, escalation, logging, tests |
| **P7** | Minggu 8 | **Deploy**: Docker Compose, docs, CI/CD, backup |

---

## 🔐 Security Checklist

- [ ] Baileys auth creds → **AES-256 encrypted** sebelum disimpan di DB
- [ ] JWT token → **RS256** atau minimal secret kuat
- [ ] Rate limiting → **100 req/min** per IP / per merchant
- [ ] Input validation → **Zod** di semua endpoint
- [ ] SQL injection → **Prisma prepared statements** (built-in)
- [ ] XSS → **helmet** middleware
- [ ] CORS → strict origin
- [ ] .env → **jangan commit!**
- [ ] Prisma migrate → backup DB dulu sebelum migrate di production
- [ ] Logs → **jangan log API keys / JWT tokens**

---

## 📦 .env.example

```env
# ─── Database ───
DATABASE_URL=postgresql://wani:changeme@localhost:5432/wani
DB_PASSWORD=changeme

# ─── WhatsApp ───
WA_PHONE=6281234567890

# ─── AI / LLM ───
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
LLM_MODEL=opencode/deepseek-v4-flash-free

# ─── Auth ───
JWT_SECRET=minimal-32-characters-random-string-here

# ─── App ───
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

---

> 🚀 **Ini pondasi final** — gak bakal jadi proyek sampah. Semua dari DB integrity, AI safety, reconnection, sampai Docker production udah di-cover.
>
> Kalo udah oke, tinggal gas coding pake OpenCode sub-agent parallel. Siap? 👊
