# WANI — GitHub Issues (32 Sub-Issues)

> Perencanaan detail untuk menyelesaikan WANI. Dipecah menjadi **32 issue kecil** agar tiap unit kerja fokus dan maksimal (estimasi tiap issue: 1-2 hari).
> Perkiraan total: **6-8 minggu** untuk 1 developer.

---

## 📂 Struktur Folder

```
.github/issues/
├── README.md
├── 00-ROADMAP.md                    ← Master plan & dependency graph
│
├── foundation/                      # FND-01 sampai FND-05
│   ├── 01-monorepo-setup.md
│   ├── 02-express-migration.md
│   ├── 03-shared-prisma-package.md
│   ├── 04-nextjs-scaffold.md
│   └── 05-docker-compose-dev.md
│
├── api/                             # API-01 sampai API-04
│   ├── 06-web-store-endpoints.md
│   ├── 07-dashboard-stats-endpoints.md
│   ├── 08-wa-session-endpoints.md
│   └── 09-baileys-ai-polish.md
│
├── testing/                         # TST-01 sampai TST-03
│   ├── 10-unit-tests-services.md
│   ├── 11-unit-tests-ai-pipeline.md
│   └── 12-integration-tests-api.md
│
├── dashboard/                       # DSH-01 sampai DSH-11
│   ├── 13-auth-login-register.md
│   ├── 14-dashboard-layout.md
│   ├── 15-overview-page.md
│   ├── 16-products-crud.md
│   ├── 17-orders-management.md
│   ├── 18-chats-page.md
│   ├── 19-ai-config-page.md
│   ├── 20-customers-page.md
│   ├── 21-settings-page.md
│   └── 22-wa-session-page.md
│
├── webstore/                        # WST-01 sampai WST-06
│   ├── 23-store-routes-data.md
│   ├── 24-store-landing-page.md
│   ├── 25-product-catalog-detail.md
│   └── 26-store-dashboard-settings.md
│
├── template/                        # TPL-01 sampai TPL-03
│   ├── 27-template-system.md
│   ├── 28-template-preview-selector.md
│   └── 29-static-site-generator.md
│
└── final/                           # FIN-01 sampai FIN-05
    ├── 30-api-developer-docs.md
    ├── 31-user-guide-umkm.md
    ├── 32-production-docker-deploy.md
    └── 33-dev-tooling-github.md
```

## 🚀 Recommended Order

```
FND-01 → FND-02 → FND-03 (paralel) → FND-04 (paralel) → FND-05
    ↓
API-06 → API-07 → API-08 → API-09
    ↓
DSH-13 → DSH-14 → DSH-15 → DSH-16 → DSH-17
    ↓
WST-23 → WST-24 → WST-25 → WST-26
    ↓
DSH-18 → DSH-19 → DSH-20 → DSH-21 → DSH-22
    ↓
TPL-27 → TPL-28 → TPL-29
    ↓
TST-10 → TST-11 → TST-12
    ↓
FIN-30 → FIN-31 → FIN-32 → FIN-33
```
