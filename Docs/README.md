# WANI — Warung AI Nexus Indonesia

Platform UMKM berbasis AI: **WhatsApp bot** melayani pelanggan otomatis, **REST API** sebagai otak (AI pipeline + guardrails), **dashboard** untuk pemilik toko, dan **generator website statis**. Repo berisi 5 paket Bun independen (bukan monorepo): `api/`, `dashboard/`, `landingpage/`, `wa-bot/`, `web-gen/`.

## Quick Start

```bash
cp .env.example .env        # POSTGRES_PASSWORD, API_TOKEN, JWT_SECRET, LLM_API_KEY
docker compose up --build   # dashboard → http://localhost:5173
```

Dev lokal: `bun run dev` (atau `dev:api` / `dev:bot` / `dev:dash`). Dashboard butuh `dashboard/.env` berisi `VITE_API_URL=http://localhost:3001/api`.

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [ARCHITECTURE.md](Docs/ARCHITECTURE.md) | Gambaran sistem, alur runtime, multi-tenancy, topologi deploy |
| [REPOSITORY_STRUCTURE.md](Docs/REPOSITORY_STRUCTURE.md) | Struktur folder, batas paket, path alias, konvensi kode |
| [CONFIGURATION.md](Docs/CONFIGURATION.md) | Semua environment variable + presedensi konfigurasi LLM |
| [DATA_MODEL.md](Docs/DATA_MODEL.md) | 17 tabel `wani_api` + 2 tabel `wa_bot`, relasi, enum, migrasi |
| [API_CONTRACT.md](Docs/API_CONTRACT.md) | Semua endpoint, model auth 3 tingkat, format respons, rate limit |
| [AI_PIPELINE.md](Docs/AI_PIPELINE.md) | 16 step pipeline, LLM engine, circuit breaker, intent action |
| [GUARDRAILS.md](Docs/GUARDRAILS.md) | 3-tier firewall, PII, rate limit, budget, output scan, grounding |
| [SERVICES/](Docs/SERVICES/README.md) | Detail per paket: [API](Docs/SERVICES/API.md) · [DASHBOARD](Docs/SERVICES/DASHBOARD.md) · [WA_BOT](Docs/SERVICES/WA_BOT.md) · [WEB_GEN](Docs/SERVICES/WEB_GEN.md) |
| [DEVELOPMENT.md](Docs/DEVELOPMENT.md) | Setup lokal, perintah per paket, workflow git, checklist kontribusi |
| [DEPLOYMENT.md](Docs/DEPLOYMENT.md) | Docker Compose produksi, CI/CD GHCR, backup, migrasi |
