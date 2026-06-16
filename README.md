# WANI — WA Niaga untuk UMKM

**WANI** (WA + Niaga) adalah platform open-source **omnichannel** yang menghidupkan bisnis UMKM dengan AI-powered customer service, dashboard manajemen web, dan website toko auto-generated.

> _"WANI — Berani Digital. WA Niaga untuk UMKM."_

---

## 🚀 Visi

Banyak UMKM Indonesia cuma pake WA sebagai "papan pengumuman" — kirim katalog, trus customer japri manual. Customer servicenya ya pemiliknya sendiri, sambil jualan, sambil packing, sambil produksi.

**WANI hadir buat ngubah itu.** Bukan cuma chatbot WA biasa, tapi **ekosistem bisnis digital lengkap**:

- 🤖 **AI Customer Service** di WhatsApp — otomatis, natural, 24/7
- 🖥️ **Dashboard Web Admin** — atur produk, order, AI prompt, laporan
- 🌐 **Auto-Generated Web Store** — tiap UMKM dapet website toko sendiri
- 💰 **Payment Tracking** — QRIS, transfer, cash — semua tercatat
- 🔗 **Single Source of Truth** — satu data, semua channel (WA + Web)

---

## ✨ Fitur Inti

### 🤖 WA Bot + AI
- LLM-powered customer service (DeepSeek / OpenRouter)
- Auto order parsing dari chat WA
- Human escalation flow
- Reconnection engine (24/7 online)

### 🖥️ Dashboard Web (Next.js)
- 📊 **Overview** — Statistik real-time: order, revenue, AI vs human handle rate
- 🛍️ **Products** — CRUD produk: nama, harga, stok, kategori, foto
- 📦 **Orders** — Semua order dari WA, status tracking (pending → confirmed → processing → completed)
- 💬 **Chats** — Riwayat percakapan per customer, filter AI vs human
- 🤖 **AI Config** — Atur system prompt, fallback message, auto-reply rules
- 👥 **Customers** — Data pelanggan, riwayat order, total transaksi
- ⚙️ **Settings** — Profil toko, WA number, payment method (QRIS, transfer, cash), koneksi Baileys
- 🌐 **Web Store** — Preview + setting landing page auto-generated

### 🌐 Auto-Generated Web Store
Tiap UMKM yang pake WANI otomatis dapet website toko:

```
tokobudi.wani.my.id
├── 🏪 Landing page dengan profil toko
├── 🛍️ Katalog produk online (real-time dari database)
├── 🔍 Kategori & pencarian produk
├── 💬 Tombol WA tiap produk → langsung chat dengan pesan otomatis
└── 📱 Mobile-first, responsive
```

**Cara kerja:**
1. Data produk diambil dari database yang **SAMA** dengan WA bot
2. Pilih template → web langsung jadi (auto-generate)
3. Tombol WA di tiap produk → "Halo, saya mau pesan [produk] — Rp[price]"
4. Chat masuk langsung diproses AI WANI seperti biasa
5. **Single source of truth** — produk di dashboard = produk di WA bot = produk di website

### 🔧 Lainnya
- Payment tracking (QRIS, transfer, cash)
- Activity log & audit trail
- Self-hosted via Docker

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Runtime** | Node.js 20+ |
| **Backend API** | Express + TypeScript |
| **Frontend** | Next.js 14+ (App Router) |
| **Database** | PostgreSQL 16 + Prisma ORM |
| **WhatsApp** | Baileys WebSocket |
| **AI/LLM** | OpenRouter / DeepSeek |
| **Auth** | JWT + WA OTP |
| **Deploy** | Docker Compose |

---

## 📁 Struktur Proyek

```
WANI/
├── apps/
│   ├── api/                  # Express backend (WA bot, REST API)
│   │   ├── src/
│   │   │   ├── baileys/      # WhatsApp engine
│   │   │   ├── ai/           # AI/LLM pipeline
│   │   │   ├── pipeline/     # Message routing
│   │   │   ├── services/     # Business logic
│   │   │   └── routes/       # REST API endpoints
│   │   └── ...
│   └── web/                  # Next.js (Dashboard + Web Store)
│       ├── src/
│       │   ├── app/
│       │   │   ├── dashboard/  # Admin panel (login required)
│       │   │   ├── store/      # Public web toko (auto-gen)
│       │   │   └── templates/  # Template editor
│       │   └── ...
│       └── ...
├── packages/
│   └── database/             # Prisma schema (shared)
├── docker-compose.yml
└── ...
```

---

## 🚦 Status

🚧 **Development — fase perencanaan pondasi selesai. Memasuki fase coding.**

| Komponen | Status |
|----------|--------|
| ✅ Arsitektur & ERD | Done |
| ✅ Tech stack | Done |
| 🏗️ Express backend | In progress |
| ⏳ Next.js dashboard | Planned |
| ⏳ Web Store generator | Planned |
| ⏳ Docker Compose | Planned |

---

## 📄 Lisensi

MIT — bebas dipake, dimodifikasi, dan disebarluaskan.
