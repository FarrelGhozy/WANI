# WANI — Project Architecture

> **WANI** (WA + Niaga) — Platform open-source omnichannel untuk UMKM: AI WhatsApp Bot + Dashboard Web + Auto-Generated Web Store.
> Tagline: *"Berani Digital. WA Niaga untuk UMKM."*

---

## 📋 Overview

WANI adalah platform yang mengubah WhatsApp UMKM dari sekadar "papan pengumuman" menjadi **sistem bisnis hidup omnichannel**. Pelanggan bisa berinteraksi lewat WA (chat biasa) maupun website toko auto-generated — semuanya nyambung ke satu sistem backend dengan AI customer service.

**Data integrity is non-negotiable** — itulah kenapa kita pake PostgreSQL + Prisma ORM, baik untuk backend Express maupun frontend Next.js.

---

## 🛠️ Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Runtime** | Node.js 20+ | Familiar, ringan, satu ekosistem |
| **Backend API** | **Express** ✅ | REST API untuk WA bot + data |
| **Frontend** | **Next.js 14+ (App Router)** ✅ | SSR, RSC, static export untuk web store |
| **Database** | **PostgreSQL 16** ✅ | ACID buat data uang & order, JSONB buat chat |
| **ORM** | **Prisma** ✅ | Type-safe, shared antara Express & Next.js |
| **WA Engine** | **Baileys** ✅ | Library langsung, ringan, kontrol penuh |
| **Session WA** | PostgreSQL (encrypted) | Auth creds disimpan aman di DB |
| **AI/LLM** | OpenRouter / DeepSeek | Free tier, multi-model, OpenAI-compatible |
| **Auth** | JWT + WA OTP | Simple, no email, cocok UMKM |
| **Logging** | **Pino** + ActivityLog DB | Structured logging + audit trail |
| **Deploy** | **Docker Compose** 🐳 | 3 service: Express + Next.js + PostgreSQL |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            WANI PLATFORM                                    │
│                                                                              │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐ │
│  │      Express Backend (API)       │    │     Next.js Frontend (Web)      │ │
│  │  ┌───────────────────────────┐  │    │  ┌───────────────────────────┐  │ │
│  │  │     Baileys Manager       │  │    │  │    Dashboard (Admin)      │  │ │
│  │  │  ┌──────┐ ┌──────┐ ┌───┐  │  │    │  │  ├── /dashboard/*        │  │ │
│  │  │  │Socket│ │ Auth │ │Re- │  │  │    │  │  ├── Products CRUD       │  │ │
│  │  │  │Mgr   │ │Store │ │conn│  │  │    │  │  ├── Orders Management   │  │ │
│  │  │  └──────┘ └──────┘ └───┘  │  │    │  │  ├── AI Config           │  │ │
│  │  └───────────┬───────────────┘  │    │  │  └── Settings             │  │ │
│  │               │ messages event   │    │  └───────────────────────────┘  │ │
│  │               ▼                  │    │  ┌───────────────────────────┐  │ │
│  │  ┌───────────────────────────┐  │    │  │   Web Store (Public)      │  │ │
│  │  │     Message Pipeline      │  │    │  │  ├── /store/[slug]        │  │ │
│  │  │  ┌──────┐ ┌────┐ ┌────┐  │  │    │  │  ├── Product Catalog      │  │ │
│  │  │  │Router│ │LLM │ │Val │  │  │    │  │  └── WA Checkout           │  │ │
│  │  │  │(dedup│ │(in-│ │idat│  │  │    │  └───────────────────────────┘  │ │
│  │  │  │class)│ │tent│ │e)  │  │  │    │  ┌───────────────────────────┐  │ │
│  │  │  └──────┘ └────┘ └────┘  │  │    │  │   Static Site Export     │  │ │
│  │  └───────────────────────────┘  │    │  │  ├── next export         │  │ │
│  │  ┌───────────────────────────┐  │    │  │  └── Deploy ke CDN       │  │ │
│  │  │     REST API Routes       │  │    │  └───────────────────────────┘  │ │
│  │  │  /api/merchants /products │  │    └─────────────────────────────────┘ │
│  │  │  /api/orders /conversation│  │                      │                  │
│  │  └───────────┬───────────────┘  │                      │ HTTP              │
│  └──────────────┼──────────────────┘                      │                   │
│                 │ HTTP + WebSocket                         │                   │
│                 ▼                                          ▼                   │
│        ┌──────────────────────────────────────────────────────┐              │
│        │                   PostgreSQL                           │              │
│        │  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌────────┐  │              │
│        │  │Produk│ │Order │ │Chat  │ │Merchant│ │Template│  │              │
│        │  └──────┘ └──────┘ └──────┘ └────────┘ └────────┘  │              │
│        └──────────────────────────┬───────────────────────────┘              │
│                                   │                                          │
│                                   ▼                                          │
│        ┌──────────────────────────────────────────────────────┐              │
│        │                WhatsApp (Baileys)                      │              │
│        │         ────────────────┬─────────────────            │              │
│        │         Customer 👤 ←→ AI reply → Customer            │              │
│        └──────────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Alur Data Omnichannel

```
Customer WA ──┐
              ├──→ Baileys → Message Pipeline → AI → Prisma → PostgreSQL
              │                                        │
Customer Web ──┘                                        │
              │                                         │
              ▼                                         ▼
     Next.js Web Store ←── (read) ──────────── Products DB
     (auto-generated)        Data SAMA dengan WA bot
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
MERCHANT 1──1 WEB_STORE        ← NEW
MERCHANT 1──N TEMPLATE         ← NEW (optional, kalo multi-template)
CUSTOMER 1──N ORDER
CUSTOMER 1──N CONVERSATION
CATEGORY 1──N PRODUCT
ORDER    1──N ORDER_ITEM
ORDER    1──1 PAYMENT
PRODUCT  1──N ORDER_ITEM
CONVERSATION 1──N MESSAGE
```

### Model Tambahan untuk Web Store

```prisma
model WebStore {
  id            String   @id @default(uuid())
  merchantId    String   @unique @map("merchant_id")
  slug          String   @unique              // tokobudi.wani.my.id
  template      String   @default("default")  // template name
  isPublished   Boolean  @default(false) @map("is_published")
  customDomain  String?  @map("custom_domain")
  seoTitle      String?
  seoDesc       String?
  theme         Json?    // warna, font, layout config
  heroImage     String?  @map("hero_image")
  heroText      String?  @map("hero_text")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  merchant Merchant @relation(fields: [merchantId], references: [id])

  @@map("web_stores")
}

model Template {
  id        String   @id @default(uuid())
  name      String   @unique
  label     String               // "Modern", "Minimal", "Classic"
  thumbnail String?              // preview image
  config    Json?                 // default theme values
  isPublic  Boolean  @default(true) @map("is_public")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("templates")
}
```

> **Catatan:** Model di atas bisa ditambahkan nanti saat mulai ngoding frontend. Untuk sekarang, cukup paham strukturnya.

### Full Prisma Schema (Original)

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
  webStore      WebStore?

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

// ─── Web Store ──────────────────────────────────────────

model WebStore {
  id           String   @id @default(uuid())
  merchantId   String   @unique @map("merchant_id")
  slug         String   @unique              // tokobudi.wani.my.id/~slug
  template     String   @default("default")
  isPublished  Boolean  @default(false) @map("is_published")
  customDomain String?  @map("custom_domain")
  seoTitle     String?
  seoDesc      String?
  theme        Json?    // warna, font, layout config
  heroImage    String?  @map("hero_image")
  heroText     String?  @map("hero_text")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  merchant Merchant @relation(fields: [merchantId], references: [id])

  @@map("web_stores")
}

model Template {
  id        String   @id @default(uuid())
  name      String   @unique
  label     String               // "Modern", "Minimal", "Classic"
  thumbnail String?              // preview image
  config    Json?                 // default theme values
  isPublic  Boolean  @default(true) @map("is_public")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("templates")
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
}
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
| **Shared schema** | ✅ Prisma package bisa dipake Express & Next.js |

---

## 🌐 Next.js Frontend Architecture

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login/register layout
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── dashboard/           # Admin panel (protected)
│   │   │   ├── layout.tsx       # Sidebar + header layout
│   │   │   ├── page.tsx         # Overview stats
│   │   │   ├── products/        # CRUD produk
│   │   │   ├── orders/          # Manajemen order
│   │   │   ├── chats/           # Riwayat percakapan
│   │   │   ├── ai-config/       # System prompt, fallback
│   │   │   ├── customers/       # Data pelanggan
│   │   │   ├── settings/        # Profil toko, payment, WA
│   │   │   └── web-store/       # Preview + setting web
│   │   │
│   │   ├── store/               # Public web toko (auto-gen)
│   │   │   └── [slug]/          # Dynamic route per merchant
│   │   │       ├── page.tsx     # Landing page
│   │   │       ├── products/    # Katalog produk
│   │   │       └── product/[id] # Detail produk
│   │   │
│   │   ├── templates/           # Template showcase
│   │   └── api/                 # Next.js API routes (proxy ke Express)
│   │
│   ├── components/              # Shared UI components
│   │   ├── ui/                  # primitives (button, card, etc)
│   │   ├── dashboard/           # Dashboard-specific
│   │   └── store/               # Web store-specific
│   │
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client (read-only for store)
│   │   ├── api.ts               # Express API client
│   │   └── utils.ts
│   │
│   └── types/
│       └── index.ts
```

### Dashboard Pages

| Halaman | Route | Fungsi |
|---------|-------|--------|
| **Overview** | `/dashboard` | Statistik real-time: order, revenue, AI handle rate |
| **Products** | `/dashboard/products` | CRUD produk: nama, harga, stok, kategori, foto |
| **Orders** | `/dashboard/orders` | Semua order dari WA, status tracking |
| **Chats** | `/dashboard/chats` | Riwayat percakapan per customer |
| **AI Config** | `/dashboard/ai-config` | Atur system prompt, fallback, auto-reply |
| **Customers** | `/dashboard/customers` | Data pelanggan, riwayat order |
| **Settings** | `/dashboard/settings` | Profil toko, WA number, payment |
| **Web Store** | `/dashboard/web-store` | Preview + setting landing page |

### Auto-Generated Web Store

Tiap merchant dapet web store unik di `/store/[slug]`:

```
/store/toko-budi
├── 🏪 Hero section (nama toko, tagline, foto)
├── 📂 Kategori produk
├── 🛍️ Grid produk (card: foto, nama, harga, tombol WA)
├── 🔍 Pencarian produk
└── 💬 Floating tombol WA

Setiap produk → tombol "Pesan Lewat WA"
→ otomatis generate link wa.me dengan pesan:
  "Halo, saya mau pesan [produk] — Rp[harga]"
```

**Static Generation:**
- Web store bisa di-export sebagai static site (`next export`)
- Cocok buat di-deploy ke CDN / GitHub Pages / Netlify
- Data di-fetch saat build time dari API Express

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
First:  No session → generate QR → save to WaSession.qrCode → show to merchant via Dashboard
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
1. Primary:   OpenRouter → deepseek-v4-flash-free (default per merchant)
2. Fallback:  OpenRouter → gemini-2.0-flash (free)
3. Offline:   "Maaf kak, sistem sedang sibuk. Silakan coba lagi nanti."
```

---

## 📋 Order State Machine

```mermaid
statusDiagram
    [*] --> PENDING      : AI terima order dari WA / Web
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
| PENDING | CONFIRMED | Auto (trusted customer) / Manual (merchant) | AI / Merchant via Dashboard |
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

## 🌐 API Design

### REST API (Express Backend)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/health` | Healthcheck |
| POST | `/api/auth/login` | Login (WA OTP) |
| POST | `/api/auth/register` | Register merchant |
| GET | `/api/merchants/:id` | Profil merchant |
| PUT | `/api/merchants/:id` | Update profil |
| GET | `/api/products` | List produk (by merchant) |
| POST | `/api/products` | Tambah produk |
| PUT | `/api/products/:id` | Update produk |
| DELETE | `/api/products/:id` | Hapus produk |
| GET | `/api/orders` | List order |
| PUT | `/api/orders/:id/status` | Update status order |
| GET | `/api/conversations` | List percakapan |
| GET | `/api/conversations/:id/messages` | Pesan dalam percakapan |
| POST | `/api/conversations/:id/messages` | Kirim pesan sebagai human |
| GET | `/api/ai-agent/:merchantId` | Config AI |
| PUT | `/api/ai-agent/:merchantId` | Update config AI |
| GET | `/api/web-store/:merchantId` | Config web store |
| PUT | `/api/web-store/:merchantId` | Update config web store |
| POST | `/api/wa-session/:merchantId/connect` | Init koneksi WA |
| GET | `/api/wa-session/:merchantId/qr` | QR code terbaru |

### Next.js API Routes (Proxy)

Next.js API routes berfungsi sebagai BFF (Backend For Frontend):

```typescript
// apps/web/src/app/api/products/route.ts
// → Proxy ke Express: GET /api/products?merchantId=xxx
// → Dengan auth token dari cookie
```

Atau bisa juga langsung pake Prisma dari Next.js server component (READ-only untuk web store public).

---

## 📁 Directory Structure (Final)

```
WANI/
│
├── apps/
│   ├── api/                          # Express backend
│   │   ├── server.js                 # Entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Full DB schema
│   │   │   └── seed.ts               # Demo merchant seed
│   │   │
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── index.ts          # Env config
│   │   │   │   ├── prisma.ts         # Prisma client
│   │   │   │   └── logger.ts         # Pino logger
│   │   │   │
│   │   │   ├── baileys/              # WhatsApp Engine
│   │   │   │   ├── manager.ts        # Connection state machine
│   │   │   │   ├── auth.ts           # Session save/load + encrypt
│   │   │   │   ├── handlers.ts       # Event handlers
│   │   │   │   ├── sender.ts         # Send message
│   │   │   │   └── types.ts          # Baileys types
│   │   │   │
│   │   │   ├── ai/                   # AI/LLM Engine
│   │   │   │   ├── engine.ts         # OpenRouter caller
│   │   │   │   ├── prompts.ts        # System prompt templates
│   │   │   │   ├── schemas.ts        # JSON output schemas
│   │   │   │   └── validator.ts      # Validate LLM output
│   │   │   │
│   │   │   ├── pipeline/             # Message Pipeline
│   │   │   │   ├── router.ts         # Dedup + classify + route
│   │   │   │   ├── intent-classifier.ts
│   │   │   │   ├── order-parser.ts
│   │   │   │   ├── inquiry-handler.ts
│   │   │   │   └── escalation.ts
│   │   │   │
│   │   │   ├── services/             # Business Logic
│   │   │   │   ├── merchant.service.ts
│   │   │   │   ├── customer.service.ts
│   │   │   │   ├── product.service.ts
│   │   │   │   ├── order.service.ts
│   │   │   │   ├── payment.service.ts
│   │   │   │   ├── conversation.service.ts
│   │   │   │   └── ai-agent.service.ts
│   │   │   │
│   │   │   ├── routes/               # REST API
│   │   │   │   ├── index.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── merchants.routes.ts
│   │   │   │   ├── customers.routes.ts
│   │   │   │   ├── products.routes.ts
│   │   │   │   ├── orders.routes.ts
│   │   │   │   ├── conversations.routes.ts
│   │   │   │   └── health.routes.ts
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── error-handler.ts
│   │   │   │   ├── validator.ts
│   │   │   │   └── rate-limit.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── wa-formatter.ts
│   │   │   │   └── helpers.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── index.ts
│   │   │
│   │   └── tests/
│   │       ├── unit/
│   │       │   ├── order-parser.test.ts
│   │       │   ├── ai-validator.test.ts
│   │       │   └── state-machine.test.ts
│   │       └── integration/
│   │           ├── baileys-mock.test.ts
│   │           └── api.test.ts
│   │
│   └── web/                          # Next.js frontend
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       │
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/
│       │   │   │   ├── login/
│       │   │   │   └── register/
│       │   │   ├── dashboard/
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx
│       │   │   │   ├── products/
│       │   │   │   ├── orders/
│       │   │   │   ├── chats/
│       │   │   │   ├── ai-config/
│       │   │   │   ├── customers/
│       │   │   │   ├── settings/
│       │   │   │   └── web-store/
│       │   │   ├── store/
│       │   │   │   └── [slug]/
│       │   │   │       ├── page.tsx
│       │   │   │       ├── products/
│       │   │   │       └── product/[id]/
│       │   │   ├── templates/
│       │   │   └── api/
│       │   │
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   ├── dashboard/
│       │   │   └── store/
│       │   │
│       │   ├── lib/
│       │   │   ├── prisma.ts
│       │   │   ├── api.ts
│       │   │   └── utils.ts
│       │   │
│       │   └── types/
│       │       └── index.ts
│       │
│       └── public/
│           ├── images/
│           └── templates/
│
├── packages/
│   └── database/                     # Shared Prisma package
│       ├── package.json
│       ├── prisma/
│       │   └── schema.prisma
│       ├── src/
│       │   ├── index.ts
│       │   └── client.ts
│       └── tsconfig.json
│
├── docker-compose.yml                # 3 service: Express + Next.js + Postgres
├── Dockerfile.api
├── Dockerfile.web
├── .env.example
├── README.md
└── ARCHITECTURE.md
```

---

## 🧪 Testing Strategy

| Level | Tools | Apa yang di-test |
|-------|-------|------------------|
| **Unit** | Vitest / Jest | order-parser, AI validator, state machine |
| **Integration** | Supertest | API endpoints, Prisma queries |
| **Baileys Mock** | Custom MockSocket | Message pipeline tanpa WA real |
| **LLM Mock** | Nock / MSW | AI engine tanpa API call real |
| **E2E** | Playwright (future) | Dashboard UI flow |

---

## 🐳 Docker Compose (Final)

```yaml
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

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    container_name: wani-api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://wani:${DB_PASSWORD}@postgres:5432/wani
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      WA_PHONE: ${WA_PHONE}
      LOG_LEVEL: info
    networks:
      - wani-net

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    container_name: wani-web
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001
      DATABASE_URL: postgresql://wani:${DB_PASSWORD}@postgres:5432/wani
    networks:
      - wani-net

volumes:
  pg_data:

networks:
  wani-net:
    driver: bridge
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

# 4. Akses
# Dashboard: http://localhost:3000/dashboard
# API:       http://localhost:3001/health

# 5. Lihat QR (first time)
docker compose logs -f api
# Scan QR dari WhatsApp > Linked Devices
```

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
- [ ] Next.js → **no sensitive data in client components**

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
API_PORT=3001
WEB_PORT=3000
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🏆 Dampak buat NIC Pekan IT 2026

| Dari | Jadi |
|------|------|
| WA bot + AI | WA bot + AI + Dashboard + Auto-Web |
| Cuma backend | Full stack + deployment |
| Satu channel | Omnichannel (WA + Web) |
| Admin pake WA | Admin pake Dashboard web |
| Katalog manual | Katalog online 24/7 otomatis |

Yang bikin WANI makin unik:
- ✅ **Auto-generate web toko dari data yang sama** — ini BELUM ADA di open source competitor
- ✅ Dashboard buat UMKM yang gak perlu ngoding
- ✅ QRIS + payment tracking built-in
- ✅ Semua bisa self-hosted pake Docker (no monthly fee)

---

## 📈 Milestone

| Phase | Target | Deliverable |
|-------|--------|-------------|
| **P1** | Minggu 1-2 | **Foundation**: Express + Prisma + PostgreSQL + Auth JWT |
| **P2** | Minggu 3 | **Baileys**: Connection manager, session, send/receive |
| **P3** | Minggu 4 | **AI Engine**: LLM integration, intent parser, order parsing |
| **P4** | Minggu 5 | **Business Logic**: Order CRUD, state machine, stock, payment |
| **P5** | Minggu 6 | **Pipeline**: Message router → AI → validate → execute → reply |
| **P6** | Minggu 7 | **Next.js Dashboard**: All dashboard pages + auth |
| **P7** | Minggu 8 | **Web Store + Deploy**: Auto-generated store, static export, Docker |

---

> 🚀 **WANI — Bukan cuma chatbot. Ini ekosistem bisnis digital untuk UMKM Indonesia.**
>
> Siap gas coding? 🫡
