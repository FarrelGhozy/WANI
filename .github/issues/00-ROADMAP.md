# WANI Roadmap — 32 Issues

## Legend
- 🔴 **High** — blocking, harus dikerjain dulu
- 🟡 **Medium** — penting tapi gak blocking
- 🟢 **Low** — bisa di akhir

---

## 🏗️ Fase 1: Foundation (5 issues, ~7 hari)

| ID | Issue | Priority | Depends On |
|----|-------|----------|------------|
| FND-01 | Setup pnpm monorepo workspace | 🔴 High | - |
| FND-02 | Migrate Express code to apps/api | 🔴 High | FND-01 |
| FND-03 | Create packages/database (shared Prisma) | 🔴 High | FND-01 |
| FND-04 | Scaffold Next.js apps/web | 🔴 High | FND-01 |
| FND-05 | Docker Compose local development | 🔴 High | FND-02, FND-03, FND-04 |

## ⚙️ Fase 2: Backend API (4 issues, ~6 hari)

| ID | Issue | Priority | Depends On |
|----|-------|----------|------------|
| API-06 | Web Store CRUD endpoints | 🔴 High | FND-02, FND-03 |
| API-07 | Dashboard stats aggregation endpoints | 🔴 High | FND-02 |
| API-08 | WA Session management endpoints | 🟡 Medium | FND-02 |
| API-09 | Baileys & AI pipeline bug fixes | 🟡 Medium | FND-02 |

## 🧪 Fase 3: Testing (3 issues, ~5 hari)

| ID | Issue | Priority | Depends On |
|----|-------|----------|------------|
| TST-10 | Unit tests: Business services | 🟡 Medium | API-06 s/d API-09 |
| TST-11 | Unit tests: AI Pipeline & Validator | 🟡 Medium | API-09 |
| TST-12 | Integration tests: All API endpoints | 🟡 Medium | TST-10, TST-11 |

## 🖥️ Fase 4: Dashboard (10 issues, ~14 hari)

| ID | Issue | Priority | Depends On |
|----|-------|----------|------------|
| DSH-13 | Next.js auth: login/register + middleware | 🔴 High | FND-04 |
| DSH-14 | Dashboard layout: sidebar, header, responsive | 🔴 High | DSH-13 |
| DSH-15 | Overview page: stats, recent orders, activity | 🔴 High | DSH-14, API-07 |
| DSH-16 | Products CRUD page | 🔴 High | DSH-14 |
| DSH-17 | Orders management page | 🔴 High | DSH-14 |
| DSH-18 | Chats/conversations page | 🟡 Medium | DSH-14 |
| DSH-19 | AI Configuration page | 🟡 Medium | DSH-14 |
| DSH-20 | Customers page | 🟡 Medium | DSH-14 |
| DSH-21 | Settings page (toko, payment, delivery) | 🟡 Medium | DSH-14 |
| DSH-22 | WA Session connection page | 🟡 Medium | DSH-14, API-08 |

## 🌐 Fase 5: Web Store (4 issues, ~7 hari)

| ID | Issue | Priority | Depends On |
|----|-------|----------|------------|
| WST-23 | Store routes + data fetching | 🔴 High | FND-04, FND-03 |
| WST-24 | Store landing page: hero, categories, grid | 🔴 High | WST-23 |
| WST-25 | Product catalog + product detail page | 🟡 Medium | WST-24 |
| WST-26 | Store dashboard settings: publish, SEO, hero | 🟡 Medium | WST-23, DSH-14 |

## 🎨 Fase 6: Template & Static (3 issues, ~5 hari)

| ID | Issue | Priority | Depends On |
|----|-------|----------|------------|
| TPL-27 | Template system engine + seed templates | 🟡 Medium | WST-24 |
| TPL-28 | Template preview & selector di dashboard | 🟢 Low | TPL-27, DSH-14 |
| TPL-29 | Static site generator script | 🟢 Low | TPL-27 |

## 📚 Fase 7: Final Polish (4 issues, ~5 hari)

| ID | Issue | Priority | Depends On |
|----|-------|----------|------------|
| FIN-30 | API documentation + developer docs | 🟡 Medium | All API issues |
| FIN-31 | User guide untuk UMKM | 🟢 Low | All dashboard & store issues |
| FIN-32 | Production Docker Compose + deployment | 🟡 Medium | FND-05 |
| FIN-33 | Dev tooling + GitHub templates | 🟢 Low | All |

---

## Total Estimasi

| Fase | Issues | Hari |
|------|--------|------|
| Foundation | 5 | ~7 |
| Backend API | 4 | ~6 |
| Testing | 3 | ~5 |
| Dashboard | 10 | ~14 |
| Web Store | 4 | ~7 |
| Template & Static | 3 | ~5 |
| Final Polish | 4 | ~5 |
| **Total** | **33** | **~49 hari (~7 minggu)** |

> Paralel work dimungkinkan: testing bisa jalan setelah API selesai, terlepas dari dashboard.
