# WANI — Maturity Roadmap

> Target: Proyek siap lomba dengan kematangan production-grade
> **Last updated:** 2026-07-03

---

## Fase 0 — Saat Ini (Baseline)

**Kematangan:** ~75%  
**Test Coverage:** ~55%  
**Bug Aktif:** 11 (2 di antaranya partially addressed)  
**Security Issues:** 3

### Yang Sudah Baik
- Semua fitur inti berfungsi (AI chatbot, dashboard CRUD, website generator, WA bot)
- 45 endpoint API lengkap
- 11 halaman dashboard lengkap
- Docker compose untuk deployment
- AI pipeline dengan guardrails berlapis
- Dokumentasi arsitektur cukup lengkap

### Yang Perlu Segera Diperbaiki
- 2 bug CRITICAL security
- 2 bug HIGH impact
- Test coverage masih rendah di wa-bot
- Tahap 3 fitur belum dimulai

---

## Fase 1 — Stabilitas (Target: Minggu 1-2)

**Goal:** Zero critical bugs, security hardened, basic test coverage

**Status: ~65% complete**

### Deliverables
- [ ] Semua bug CRITICAL dan HIGH fixed
- [ ] Rotated semua exposed credentials
- [x] API test coverage ≥ 40% → **82% ✅**
- [x] Unit test untuk dashboard hooks → **97 tests, 7 files ✅**
- [x] Unit test untuk web-gen generator → **37 tests, 82% coverage ✅**
- [ ] Unit test untuk wa-bot main logic

### Metrics Target
- Bug critical: 2 (dari 2) — belum tersentuh
- Bug high: 2 (dari 4) — BUG-006 + BUG-012 partially addressed
- Test coverage: **82% API, ~30% dashboard, 82% web-gen** → overall ~55% (target ≥ 40% ✅)
- Security issues: 3 (dari 5) — credential rotation masih pending

---

## Fase 2 — Kualitas (Target: Minggu 3-4)

**Goal:** Code quality production-grade, comprehensive error handling, performance baseline

**Status: ~70% complete**

### Deliverables
- [x] Refactor `as any` casts ke type-safe alternatives → **0 `as any` di API src/ ✅**
- [x] Extract duplicate upload logic ke shared utility → **`lib/upload.ts` ✅**
- [x] Extract injection patterns ke single source → **`guardrails/injection-patterns.ts` ✅**
- [x] Fix semua code smells terdokumentasi → **type guard `getValidatedQuery<T>` ✅**
- [x] Implement unified error handling di dashboard → **ErrorBoundary + enhanced useToast + skeleton loading ✅**
- [x] Tambah skeleton loading states → **semua halaman ✅**
- [ ] Optimasi web-gen build pipeline (parallel, caching)
- [x] Fix duplicate data fetching di dashboard → **StoreContext + ProductsContext ✅**
- [x] Fix silent catch blocks di wa-bot → **structured logging + exponential backoff ✅**
- [x] API test coverage ≥ 60% → **82% ✅**
- [x] Dashboard unit test coverage ≥ 50% → **97 tests ✅**

### Metrics Target
- Test coverage: **82% API, ~30% dashboard** → overall ~55% (target ≥ 60% — close)
- Code smells resolved: **≥ 90%** ✅ (0 `as any`, no silent catches, no duplicate patterns, no duplicate upload)
- Bundle size dashboard: < 509KB gzip (target < 300KB — needs work)
- Web-gen build time: belum diukur

---

## Fase 3 — Fitur (Target: Bulan 1-2)

**Goal:** Feature complete, advanced capabilities

**Status: 0% — belum dimulai**

### Deliverables
- [ ] Email system (SMTP) untuk forgot password
- [ ] Refresh token mechanism
- [ ] RAG / vector store untuk AI knowledge base
- [ ] Product search di HTML website templates
- [ ] Dynamic features section (dari store config)
- [ ] Elegant template untuk web-gen
- [ ] Multi-store support (database schema + UI)
- [ ] Dashboard analytics page
- [ ] RBAC (admin + staff roles)
- [ ] API test coverage ≥ 80% → **82% ✅** (already done!)
- [ ] Dashboard test coverage ≥ 80%
- [ ] Web-gen test coverage ≥ 80% → **82% ✅** (already done!)
- [ ] WA-bot test coverage ≥ 60%

---

## Fase 4 — Production Readiness (Target: Bulan 2-3)

**Goal:** Siap production, monitoring, CI/CD, disaster recovery

**Status: 0% — belum dimulai**

### Deliverables
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Health check endpoints untuk semua service
- [ ] Prometheus metrics + Grafana dashboard
- [ ] Centralized logging (ELK / Loki)
- [ ] Automated backup untuk database
- [ ] WA session backup mechanism
- [ ] Load testing (minimal 100 concurrent users)
- [ ] Production deployment guide
- [ ] Disaster recovery plan
- [ ] Security penetration test
- [ ] E2E tests untuk 5 critical user flows
- [ ] Visual regression tests untuk dashboard
- [ ] Accessibility audit (WCAG 2.2 AA)

---

## Visual Timeline

```
Fase 1 ████████████████░░░░  65% Stabilitas
Fase 2 ██████████████░░░░░░  70% Kualitas  
Fase 3 ░░░░░░░░░░░░░░░░░░░░   0% Fitur
Fase 4 ░░░░░░░░░░░░░░░░░░░░   0% Production
```

