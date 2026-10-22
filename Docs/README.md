# WANI — Warung AI Nexus Indonesia

<div align="center">

<img src="assets/logo.png" alt="WANI — Warung AI Nexus Indonesia" width="180" />

### AI-powered commerce for Indonesian UMKM.

Automate customer conversations, manage your business, and generate storefront websites — powered by AI.

[Getting Started](#quick-start) · [Documentation](#dokumentasi) · [Architecture](Docs/ARCHITECTURE.md)

</div>

---

**WANI** is an AI-powered platform for Indonesian small businesses, combining:

- **WhatsApp Bot** — automated customer service and conversational commerce.
- **REST API** — the core AI pipeline, business logic, and safety guardrails.
- **Dashboard** — a control center for store owners.
- **Website Generator** — static storefront websites generated for businesses.

The repository contains five independent Bun packages, not a single monorepo:

`api/` · `dashboard/` · `landingpage/` · `wa-bot/` · `web-gen/`

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Open the dashboard at [http://localhost:5173](http://localhost:5173).

For local development, run `bun run dev` or use `bun run dev:api`, `bun run dev:bot`, or `bun run dev:dash`.

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
| [DATA_MODEL.md](Docs/DATA_MODEL.md) | 17 tabel `wani_api` + 2 tabel `wa_bot`, relasi, enum, migrasi |
| [API_CONTRACT.md](Docs/API_CONTRACT.md) | Semua endpoint, model auth 3 tingkat, format respons, rate limit |
| [AI_PIPELINE.md](Docs/AI_PIPELINE.md) | 16 step pipeline, LLM engine, circuit breaker, intent action |
| [GUARDRAILS.md](Docs/GUARDRAILS.md) | 3-tier firewall, PII, rate limit, budget, output scan, grounding |
| [SERVICES/](Docs/SERVICES/README.md) | Detail per paket: [API](Docs/SERVICES/API.md) · [DASHBOARD](Docs/SERVICES/DASHBOARD.md) · [WA_BOT](Docs/SERVICES/WA_BOT.md) · [WEB_GEN](Docs/SERVICES/WEB_GEN.md) |
| [DEVELOPMENT.md](Docs/DEVELOPMENT.md) | Setup lokal, perintah per paket, workflow git, checklist kontribusi |
| [DEPLOYMENT.md](Docs/DEPLOYMENT.md) | Docker Compose produksi, CI/CD GHCR, backup, migrasi |

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
