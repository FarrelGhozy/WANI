# Services

Dokumentasi per paket. Semua paket berbagi satu repository tetapi **bukan monorepo** — lihat [../REPOSITORY_STRUCTURE.md](../REPOSITORY_STRUCTURE.md).

| Paket | Dokumen | Ringkas |
|-------|---------|---------|
| `api/` | [API.md](API.md) | Express 5 + Prisma 7: REST, AI pipeline, guardrails, generator website |
| `dashboard/` | [DASHBOARD.md](DASHBOARD.md) | React 19 + Vite 8: dashboard admin `/app/*` + landing page `/` |
| `wa-bot/` | [WA_BOT.md](WA_BOT.md) | Baileys 7 RC: transport WhatsApp, state auth di Postgres |
| `web-gen/` | [WEB_GEN.md](WEB_GEN.md) | Bun + Astro 7: render template → static site + ZIP |

Dokumen lintas-paket: [../ARCHITECTURE.md](../ARCHITECTURE.md) · [../API_CONTRACT.md](../API_CONTRACT.md) · [../DATA_MODEL.md](../DATA_MODEL.md) · [../CONFIGURATION.md](../CONFIGURATION.md) · [../AI_PIPELINE.md](../AI_PIPELINE.md) · [../GUARDRAILS.md](../GUARDRAILS.md) · [../DEVELOPMENT.md](../DEVELOPMENT.md) · [../DEPLOYMENT.md](../DEPLOYMENT.md)
