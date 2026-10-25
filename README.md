# WANI — Warung AI Nexus Indonesia

<div align="center">

<img src="assets/logo.png" alt="WANI — Warung AI Nexus Indonesia" width="180" />

### AI-powered commerce for Indonesian UMKM.

Automate customer conversations, manage your business, and generate storefront websites — powered by AI.

[Getting Started](#quick-start) · [Documentation](#dokumentasi) · [Architecture](Docs/ARCHITECTURE.md)

</div>

---

**WANI** is an AI-powered platform for Indonesian small businesses, combining:

- **WhatsApp Integration (WAHA)** — automated customer service and conversational commerce.
- **REST API** — the core AI pipeline, business logic, and safety guardrails.
- **Dashboard** — a control center for store owners.
- **Website Generator** — static storefront websites generated for businesses.

The repository contains four independent packages, not a single monorepo:

`api/` · `dashboard/` · `landingpage/` · `web-gen/`

WhatsApp is handled by **WAHA**, a separate Docker service (`devlikeapro/waha`) configured in `docker-compose.yml`.

## Quick Start

```bash
cp .env.example .env
# Wajib: ganti DATABASE_PASSWORD, JWT_SECRET (>=32 karakter), dan WAHA_API_KEY
docker compose up --build
```

> API produksi menolak start bila masih memakai nilai placeholder `change-me…`.

Open the dashboard at [http://localhost:5173](http://localhost:5173).

For local development, run `bun run dev` or use `bun run dev:api`, `bun run dev:waha`, or `bun run dev:dash`.

The dashboard requires `dashboard/.env`:

```dotenv
VITE_API_URL=http://localhost:3001/api
```

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [ARCHITECTURE.md](Docs/ARCHITECTURE.md) | Gambaran sistem, alur runtime, multi-tenancy, topologi deploy |
| [REPOSITORY_STRUCTURE.md](Docs/REPOSITORY_STRUCTURE.md) | Struktur folder, batas paket, path alias, konvensi kode |
| [CONFIGURATION.md](Docs/CONFIGURATION.md) | Semua environment variable + presedensi konfigurasi LLM |
| [DATA_MODEL.md](Docs/DATA_MODEL.md) | 18 tabel `wani_api`, relasi, enum, migrasi; state WAHA di database `postgres` |
| [API_CONTRACT.md](Docs/API_CONTRACT.md) | Semua endpoint, model auth berlapis (JWT/service key), format respons, rate limit |
| [AI_PIPELINE.md](Docs/AI_PIPELINE.md) | 16 step pipeline, LLM engine, circuit breaker, intent action |
| [GUARDRAILS.md](Docs/GUARDRAILS.md) | 3-tier firewall, PII, rate limit, budget, output scan, grounding |
| [SERVICES/](Docs/SERVICES/README.md) | Detail per paket: [API](Docs/SERVICES/API.md) · [DASHBOARD](Docs/SERVICES/DASHBOARD.md) · [WAHA](Docs/SERVICES/WAHA.md) · [WEB_GEN](Docs/SERVICES/WEB_GEN.md) |
| [DEVELOPMENT.md](Docs/DEVELOPMENT.md) | Setup lokal, perintah per paket, workflow git, checklist kontribusi |
| [DEPLOYMENT.md](Docs/DEPLOYMENT.md) | Docker Compose produksi, CI/CD GHCR, backup, migrasi |

## Status Rilis

Lihat [CHANGELOG.md](CHANGELOG.md) dan [releases](https://github.com/FarrelGhozy/WANI/releases).
