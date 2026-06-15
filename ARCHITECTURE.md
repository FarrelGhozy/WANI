# WANI — Project Architecture

> **WANI** (WA + Niaga) — Platform open-source untuk menghidupkan WhatsApp UMKM dengan AI-powered customer service.
> Tagline: *"Berani Digital. WA Niaga untuk UMKM."*

---

## 📋 Overview

WANI adalah platform yang mengubah WhatsApp UMKM dari sekadar "papan pengumuman" menjadi **sistem bisnis hidup** — AI CS otomatis, order management, dan integrasi kasir. Pelanggan chat WA biasa, AI yang handle, order langsung tercatat.

**Teknologi inti:** Node.js + Express + MongoDB + Baileys + LLM (OpenRouter/DeepSeek)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      WANI APP (Node.js)                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Baileys │──│ Message  │──│   LLM    │──│  Order   │   │
│  │ (WA lib) │  │ Router   │  │ Engine   │  │ Manager  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                    │                        │
│  ┌──────────┐  ┌──────────┐  ┌────┴──────┐  ┌──────────┐   │
│  │ Customer │  │ Product  │  │  Payment  │  │  AI      │   │
│  │ Manager  │  │ Manager  │  │  Manager  │  │  Agent   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                    │                        │
│  ┌──────────┐  ┌──────────┐                                   │
│  │ Merchant │  │Settings  │                                   │
│  │ Manager  │  │ Manager  │                                   │
│  └──────────┘  └──────────┘                                   │
└──────────────────────┬─────────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
     ┌──────────────┐  ┌───────────────────┐
     │   MongoDB    │  │  REST API / WS    │
     │  (Database)  │  │  (Dashboard UI)   │
     └──────────────┘  └───────────────────┘
```

**Aliran data:** WhatsApp ↔ Baileys (WebSocket langsung) ↔ WANI Backend ↔ MongoDB

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
1. Customer chat WA ke nomor merchant
         │
         ▼
2. Baileys (built-in WANI) menangkap event messages.upsert
         │
         ▼
3. Message Router:
   ├── Cek nomor WA pelanggan (registered?)
   │   ├── Belum → Create Customer + Conversation
   │   └── Udah → Append ke Conversation existing
   │
         ▼
4. Kirim ke AI/LLM Engine
   ├── "Pesan 2 nasi goreng + 1 es teh" → LLM Parse → Order Object
   ├── "Warung buka jam berapa?"      → Ambil dari knowledge_base → Jawab
   ├── "Makasih kak"                  → Reply sambutan
   └── Garbage/tidak jelas            → "Maaf, bisa diulang kak?"
         │
         ▼
5. Kalo hasil parse = ORDER:
   ├── Order Manager:
   │   ├── Validate product + stock (cek ke MongoDB)
   │   ├── Create Order + OrderItem
   │   └── Generate invoice text
   └── Baileys → Kirim invoice ke WA customer
         │
         ▼
6. Payment konfirmasi:
   ├── Customer bayar (transfer/QRIS/cash)
   ├── Merchant update status via Dashboard / WA
   └── Order → paid
         │
         ▼
7. Semua data masuk MongoDB → Dashboard merchant
```

---

## 🛠️ Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Runtime** | Node.js 20+ (Express) | Familiar, ringan, satu ekosistem |
| **Database** | MongoDB + Mongoose | Flexible buat chat messages, JSON native |
| **WA Engine** | **Baileys** ✅ | Library langsung, ringan, kontrol penuh |
| **Session WA** | MongoDB / File | Baileys auth credentials bisa disimpan di MongoDB |
| **AI/LLM** | OpenRouter / DeepSeek | Free tier, multi-model, OpenAI-compatible |
| **Dashboard** | Next.js / EJS | Nanti belakangan, prioritas backend dulu |
| **Auth** | JWT + WA OTP | Simple, no email, cocok UMKM |
| **Deploy** | **Docker Compose** 🐳 | 3 service: WANI + MongoDB + (opsional Redis) |

---

## 📁 Directory Structure (Rencana)

```
WANI/
├── server.js                 # Entry point (Express + Baileys init)
├── package.json
├── .env                      # API keys, DB URI, WA credentials
├── docker-compose.yml        # 🐳 3 service: wani, mongo, redis
├── Dockerfile                # Multi-stage build
├── .dockerignore
├── config/
│   └── index.js              # DB, Baileys, AI config
├── baileys/                  # Baileys WhatsApp logic
│   ├── client.js             # Init & manage Baileys socket
│   ├── auth.js               # Session save/load (file or MongoDB)
│   ├── handlers.js           # messages.upsert, presence, etc
│   └── sender.js             # Helper: send text, image, buttons
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
│   └── auth.js
├── services/
│   ├── llm.js                # AI/LLM engine (OpenRouter)
│   ├── message-router.js     # Baileys event → intent → action
│   ├── order-parser.js       # Parse LLM output → Order object
│   ├── order-manager.js      # CRUD order + validation
│   └── merchant-setup.js     # Onboarding flow
├── middleware/
│   ├── auth.js               # JWT verify
│   └── error-handler.js
├── utils/
│   ├── wa-formatter.js       # Format WA messages (bold, list, dll)
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
- `PUT  /api/orders/:id/status` — Update status

### Conversations
- `GET /api/conversations?merchant_id=xxx` — Riwayat chat
- `GET /api/conversations/:id/messages` — Detail percakapan

### AI Agent
- `GET  /api/ai-agent/:merchant_id` — Config AI CS
- `PUT  /api/ai-agent/:merchant_id` — Update prompt/model

### WhatsApp (Baileys - internal, bukan endpoint)
- `messages.upsert` (Event) → Message Router → LLM Engine
- `Baileys.sendMessage()` (Function) → Kirim WA

---

## 🧠 AI/LLM Flow Detail

```
[Baileys Event: messages.upsert]
         │
         ▼
[Conversation Memory Loader]
  - Load last N messages dari MongoDB
  - Ambil data customer + produk terkait
         │
         ▼
[Build Prompt ke LLM]
  Prompt = system_prompt merchant
         + riwayat chat (N pesan terakhir)
         + pesan baru dari customer
         + daftar produk (untuk konteks)
         │
         ▼
[LLM Response → Parse Intent]
  ├── ORDER_INTENT   → "saya mau pesan 2 nasi goreng"
  ├── INQUIRY        → "harganya berapa?"
  ├── GREETING       → "pagi kak"
  ├── COMPLAINT      → "pesanan saya kok belum sampai"
  └── UNKNOWN        → fallback reply
         │
         ▼
[Action Executor]
  ├── ORDER_INTENT → OrderParser → Validate → Create Order → Reply Invoice
  ├── INQUIRY      → Query katalog → Format → Reply
  ├── GREETING     → Reply salam + menu produk
  ├── COMPLAINT    → Minta maaf → Escalate ke human (forward ke merchant)
  └── UNKNOWN      → "Maaf kak, bisa diulang? Ketik 'MENU' lihat daftar produk"
         │
         ▼
[Baileys.sendMessage() → Customer terima balasan]
```

---

## 🐳 Docker Compose (Final Deployment)

Setelah semua fitur selesai, proyek dibungkus dengan Docker Compose untuk kemudahan instalasi:

```yaml
version: "3.8"

services:
  # ─── MongoDB ────────────────────────────────────────
  mongo:
    image: mongo:7
    container_name: wani-mongo
    restart: unless-stopped
    volumes:
      - mongo_data:/data/db
    networks:
      - wani-net

  # ─── WANI Backend ────────────────────────────────────
  wani:
    build: .
    container_name: wani-app
    restart: unless-stopped
    depends_on:
      - mongo
    ports:
      - "3000:3000"          # REST API + Dashboard
    volumes:
      - wani_media:/app/uploads   # Image produk
      - wani_baileys:/app/baileys_auth  # Session WA (file-based)
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/wani
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - WA_PHONE_NUMBER=${WA_PHONE_NUMBER}
    networks:
      - wani-net

volumes:
  mongo_data:
  wani_media:
  wani_baileys:

networks:
  wani-net:
    driver: bridge
```

### Cara Install (untuk user akhir):

```bash
# 1. Clone repo
git clone https://github.com/FarrelGhozy/WANI.git
cd WANI

# 2. Setup environment
cp .env.example .env
nano .env     # Isi API key & nomor WA

# 3. Jalanin!
docker compose up -d

# 4. Scan QR (pertama kali)
docker compose logs -f wani  # lihat QR code
# Scan pake WhatsApp > Linked Devices
```

---

## 📈 Milestone Rencana

| Phase | Target | Deliverable |
|-------|--------|-------------|
| **P1** | Minggu 1-2 | Foundation: Express setup, MongoDB models, Mongoose schemas, Auth JWT |
| **P2** | Minggu 3 | WA Integration: Baileys init, auth session, send/receive message, message handler |
| **P3** | Minggu 4 | AI Engine: LLM integration (OpenRouter), intent classification, order parsing |
| **P4** | Minggu 5 | Business Logic: Order CRUD, product/customer management, invoice via WA |
| **P5** | Minggu 6 | Polish + Deploy: error handling, Docker Compose, docs, testing |
| **P6** | Future | Dashboard UI, integrasi Kasir_UTC_02 |

---

> 🚀 **Pondasi ini masih draft — kalo ada yang kurang pas, bilang aja gue update.**
> Yang penting semua fix dulu sebelum mulai ngoding.
