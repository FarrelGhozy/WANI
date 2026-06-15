# WANI — Project Architecture

> **WANI** (WA + Niaga) — Platform open-source untuk menghidupkan WhatsApp UMKM dengan AI-powered customer service.
> Tagline: *"Berani Digital. WA Niaga untuk UMKM."*

---

## 📋 Overview

WANI adalah platform yang mengubah WhatsApp UMKM dari sekadar "papan pengumuman" menjadi **sistem bisnis hidup** — AI CS otomatis, order management, dan integrasi kasir. Pelanggan chat WA biasa, AI yang handle, order langsung tercatat.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        WAHA SERVER                          │
│               (WhatsApp API / Bot Gateway)                    │
└────────────────────┬────────────────────────────────────────┘
                     │ Webhook Events
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   WANI CORE BACKEND                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Message  │  │   LLM    │  │  Order   │  │Customer  │   │
│  │ Router   │◄─┤ Engine   │──┤ Manager  │──┤ Manager  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Product  │  │ Payment  │  │  Merchant│  │  Agent   │   │
│  │ Manager  │  │ Manager  │  │  Manager │  │  Config  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐   ┌──────────────────────┐
│    MongoDB      │   │   REST API / GraphQL  │
│  (Database)     │   │   (Dashboard & Mobile)│
└─────────────────┘   └──────────────────────┘
```

---

## 🧩 Entity Definitions & Relationships

### 1. MERCHANT (UMKM)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| business_name | String | Nama usaha/toko |
| phone | String | Nomor WA merchant |
| address | String | Alamat fisik |
| is_active | Boolean | Status akun |
| created_at | DateTime | Waktu daftar |

**Relationships:**
- **1→N** CUSTOMER — punya banyak pelanggan
- **1→N** PRODUCT — punya banyak produk
- **1→N** CATEGORY — punya banyak kategori
- **1→N** ORDER — memproses banyak pesanan
- **1→N** CONVERSATION — punya banyak percakapan
- **1→1** AI_AGENT — satu konfigurasi AI CS
- **1→1** SETTING — satu setelan toko

### 2. CUSTOMER

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| merchant_id | UUID (FK→Merchant) | Pemilik toko |
| name | String | Nama pelanggan |
| phone | String | Nomor WA |
| total_orders | Number | Total pesanan |
| created_at | DateTime | Pertama kali chat |

**Relationships:**
- **N→1** MERCHANT — milik satu merchant
- **1→N** ORDER — bisa pesan berkali-kali
- **1→N** CONVERSATION — punya banyak sesi chat

### 3. PRODUCT

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| merchant_id | UUID (FK→Merchant) | Pemilik produk |
| category_id | UUID (FK→Category) | Kategori produk |
| name | String | Nama produk |
| description | Text | Deskripsi |
| price | Decimal | Harga |
| stock | Number | Stok |
| is_available | Boolean | Tersedia/tidak |
| image_url | String | Foto produk |

**Relationships:**
- **N→1** MERCHANT — milik satu merchant
- **N→1** CATEGORY — masuk satu kategori
- **1→N** ORDER_ITEM — muncul di banyak pesanan

### 4. CATEGORY

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| merchant_id | UUID (FK→Merchant) | Pemilik kategori |
| name | String | Nama kategori |
| description | Text | Deskripsi |

**Relationships:**
- **N→1** MERCHANT — milik satu merchant
- **1→N** PRODUCT — berisi banyak produk

### 5. ORDER

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| merchant_id | UUID (FK→Merchant) | Toko tujuan |
| customer_id | UUID (FK→Customer) | Pemesan |
| status | Enum | pending → confirmed → processing → completed → cancelled |
| total_amount | Decimal | Total belanja |
| source | Enum | wa_chat, manual |
| notes | Text | Catatan |
| created_at | DateTime | Waktu order |

**Relationships:**
- **N→1** MERCHANT
- **N→1** CUSTOMER
- **1→N** ORDER_ITEM
- **1→1** PAYMENT

### 6. ORDER_ITEM

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| order_id | UUID (FK→Order) | Pesanan induk |
| product_id | UUID (FK→Product) | Produk |
| qty | Number | Jumlah |
| unit_price | Decimal | Harga satuan |
| subtotal | Decimal | qty × unit_price |

**Relationships:**
- **N→1** ORDER
- **N→1** PRODUCT

### 7. PAYMENT

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| order_id | UUID (FK→Order) | Pembayaran untuk |
| method | Enum | cash, transfer, qris |
| amount | Decimal | Jumlah |
| status | Enum | pending, paid, failed |
| paid_at | DateTime | Waktu bayar |

**Relationships:**
- **1→1** ORDER

### 8. CONVERSATION

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| merchant_id | UUID (FK→Merchant) | Toko |
| customer_id | UUID (FK→Customer) | Pelanggan |
| wa_contact_id | UUID (FK) | Kontak WA |
| status | Enum | active, resolved, archived |
| last_message_at | DateTime | Chat terakhir |
| created_at | DateTime | Sesi dimulai |

**Relationships:**
- **N→1** MERCHANT
- **N→1** CUSTOMER
- **1→N** MESSAGE

### 9. MESSAGE

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| conversation_id | UUID (FK→Conversation) | Sesi chat |
| role | Enum | customer, bot, human |
| content | Text | Isi pesan |
| msg_type | Enum | text, image, order |
| metadata | JSON | Info tambahan |
| created_at | DateTime | Waktu kirim |

**Relationships:**
- **N→1** CONVERSATION

### 10. AI_AGENT

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| merchant_id | UUID (FK→Merchant) | Pemilik |
| is_active | Boolean | Hidup/mati |
| system_prompt | Text | Personality bot |
| model | String | Model LLM |
| greeting_message | Text | Sapaan awal |
| knowledge_base | Text | Info toko (jam, aturan) |

**Relationships:**
- **1→1** MERCHANT (setiap UMKM punya satu AI Agent)

### 11. SETTING

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Primary key |
| merchant_id | UUID (FK→Merchant) | Pemilik |
| key | String | Nama setelan |
| value | JSON | Nilai |

**Relationships:**
- **1→1** MERCHANT

---

## 🌊 Data Flow (WA Chat → Order)

```
1. Customer chat WA ──→ WAHA Server
2. WAHA kirim webhook ──→ WANI Message Router
3. Router cek:
   ├── Pelanggan baru? → Create Customer + Conversation
   └── Existing? → Append ke Conversation
4. Kirim ke AI/LLM Engine untuk diproses:
   ├── "Pesan 2 nasi goreng" → Parse → Order Object
   ├── "Warung buka jam berapa?" → Jawab dari knowledge_base
   └── Garbage → Reply: "Maaf, bisa diulang?"
5. Kalo order → Order Manager:
   ├── Validate product + stock
   ├── Create Order + OrderItem
   └── Kirim invoice via WA
6. Payment → Update status Order
7. All data masuk Dashboard merchant
```

---

## 🛠️ Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Runtime** | Node.js 20+ (Express) | Familiar, ringan, ecosystem WAHA juga Node |
| **Database** | MongoDB | Flexible buat chat messages (no-schema), JSON native |
| **ORM** | Mongoose | Mature, populasi reference gampang |
| **WA Gateway** | WAHA (WhatsApp HTTP API) | Self-hosted, full control, webhook events |
| **AI/LLM** | OpenRouter / DeepSeek | Free tier, multi-model, OpenAI-compatible |
| **AI Framework** | LangChain / Custom | Prompt chaining, conversation memory |
| **Dashboard** | React (Next.js) / EJS | Nanti belakangan, prioritas backend dulu |
| **Auth** | JWT + WA OTP | Simple, no email needed buat UMKM |

---

## 📁 Directory Structure (Rencana)

```
WANI/
├── server.js                 # Entry point
├── package.json
├── .env                      # API keys, DB URI
├── config/
│   └── index.js              # DB, WAHA, AI config
├── models/
│   ├── Merchant.js
│   ├── Customer.js
│   ├── Product.js
│   ├── Category.js
│   ├── Order.js
│   ├── OrderItem.js
│   ├── Payment.js
│   ├── Conversation.js
│   ├── Message.js
│   ├── AIAgent.js
│   └── Setting.js
├── routes/
│   ├── merchants.js
│   ├── customers.js
│   ├── products.js
│   ├── orders.js
│   ├── conversations.js
│   └── webhooks.js           # WAHA webhook handler
├── services/
│   ├── waha.js               # WAHA API wrapper
│   ├── llm.js                # AI/LLM engine
│   ├── order-parser.js       # Parse WA chat → order
│   └── merchant-setup.js     # Onboarding
├── middleware/
│   ├── auth.js
│   └── error-handler.js
├── utils/
│   ├── whatsapp.js           # Send WA messages
│   └── helpers.js
└── public/                   # (Future: dashboard frontend)
```

---

## 🔌 API Endpoints (Rencana)

### Merchant
- `POST /api/merchants/register` — Daftar UMKM baru
- `POST /api/merchants/login` — Login via WA OTP
- `GET  /api/merchants/:id` — Profile merchant
- `PUT  /api/merchants/:id` — Update profil

### Products
- `GET    /api/products?merchant_id=xxx` — List produk
- `POST   /api/products` — Tambah produk
- `PUT    /api/products/:id` — Update produk
- `DELETE /api/products/:id` — Hapus produk

### Orders
- `GET  /api/orders?merchant_id=xxx` — List orders
- `GET  /api/orders/:id` — Detail order
- `PUT  /api/orders/:id/status` — Update status (confirm/send/cancel)

### Conversations
- `GET /api/conversations?merchant_id=xxx` — Riwayat chat
- `GET /api/conversations/:id/messages` — Detail percakapan

### AI Agent
- `GET  /api/ai-agent/:merchant_id` — Config AI CS
- `PUT  /api/ai-agent/:merchant_id` — Update prompt/model

### Webhooks (WAHA)
- `POST /webhooks/waha/incoming` — Pesan WA masuk → diolah AI
- `POST /webhooks/waha/status` — Status delivery message

---

## 🧠 AI/LLM Flow Detail

```
[WA Message In]
      │
      ▼
[Conversation Memory Loader]
  - Load last N messages sebagai context
  - Ambil data customer + produk
      │
      ▼
[Intent Classifier]
  ├── ORDER_INTENT   → "saya mau pesan..."
  ├── INQUIRY        → "harganya berapa?"
  ├── GREETING       → "pagi kak"
  ├── COMPLAINT      → "pesanan saya kok belum sampai"
  └── UNKNOWN        → fallback reply
      │
      ▼
[Action Executor]
  ├── ORDER_INTENT → OrderParser → Validate → Create Order → Reply Invoice
  ├── INQUIRY      → Query katalog → Reply
  ├── GREETING     → Reply salam + menu
  ├── COMPLAINT    → Escalate ke human
  └── UNKNOWN      → "Maaf, bisa diulang?"
```

---

## 📈 Milestone Rencana

| Phase | Target | Deliverable |
|-------|--------|-------------|
| **P1** | Minggu 1 | Foundation: models, DB, auth, struktur project |
| **P2** | Minggu 2 | WA Integration: WAHA connect, webhook, send/receive |
| **P3** | Minggu 3 | AI Engine: LLM integration, order parsing, conversation |
| **P4** | Minggu 4 | Order Flow: CRUD order, payment, invoice WA |
| **P5** | Implementasi | Dashboard UI, integrasi Kasir_UTC_02 |

---

> 🚀 **Pondasi ini masih draft — kalo ada yang kurang pas, bilang aja gue update.**
> Yang penting semua fix dulu sebelum mulai ngoding.
