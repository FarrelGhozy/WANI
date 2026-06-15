# WANI — WA Niaga untuk UMKM

**WANI** (WA + Niaga) adalah platform open-source yang menghidupkan WhatsApp UMKM dengan AI-powered customer service, order management, dan integrasi kasir.

> _"WANI — Berani Digital. WA Niaga untuk UMKM."_

## 🚀 Visi

Banyak UMKM Indonesia cuma pake WA sebagai "papan pengumuman" — kirim katalog, trus customer japri manual. Customer servicenya ya pemiliknya sendiri, sambil jualan, sambil packing, sambil produksi.

**WANI** hadir buat ngubah itu. Biar WA mereka jadi **hidup** — order otomatis, customer service pake AI/LLM, semua nyambung ke sistem kasir. Data aman dengan PostgreSQL ACID transaction.

## ✨ Fitur Inti

- 🤖 **AI Customer Service** — LLM-powered WA bot yang handle chat pelanggan secara natural (DeepSeek / OpenRouter)
- 📋 **Auto Order Parsing** — Langganan order dari chat WA langsung masuk ke sistem
- 🏪 **Katalog Digital** — Produk UMKM bisa diakses dan dipesan via WA
- 💰 **Payment Tracking** — Cash, transfer, QRIS — semua tercatat
- 🔌 **Human Escalation** — Kalo AI ga sanggup, langsung forward ke admin
- 📊 **Dashboard UMKM** — Laporan penjualan, riwayat chat, analisa pelanggan
- 🐳 **Docker Compose Deploy** — Siap jalan di VPS 24/7 dalam 5 menit
- 🔓 **Open Source (MIT)** — Bebas pake, bebas modif, bebas kontribusi

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Runtime** | Node.js 20+ (Express + TypeScript) |
| **Database** | PostgreSQL 16 + Prisma ORM (ACID transaction) |
| **WhatsApp** | Baileys WebSocket (langsung, ringan) |
| **AI/LLM** | OpenRouter / DeepSeek (free tier) |
| **Logging** | Pino structured logger |
| **Deploy** | Docker Compose (wani + postgres) |

## 🚦 Status

🚧 **Development — fase perencanaan pondasi selesai.**

✅ Arsitektur & ERD — fix
✅ Tech stack — fix
❌ Coding — belum dimulai

## 📄 Lisensi

MIT — bebas dipake, dimodifikasi, dan disebarluaskan.
