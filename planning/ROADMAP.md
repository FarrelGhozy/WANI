# WANI — Maturity Roadmap

> Target: Proyek siap lomba dengan kematangan production-grade

---

## Fase 0 — Saat Ini (Baseline)

**Kematangan:** ~60%
**Test Coverage:** <20%
**Bug Aktif:** 13
**Security Issues:** 5

### Yang Sudah Baik
- Semua fitur inti berfungsi (AI chatbot, dashboard CRUD, website generator, WA bot)
- 45 endpoint API lengkap
- 11 halaman dashboard lengkap
- Docker compose untuk deployment
- AI pipeline dengan guardrails berlapis
- Dokumentasi arsitektur cukup lengkap

### Yang Perlu Segera Diperbaiki
- 2 bug CRITICAL security
- 4 bug HIGH impact
- Test coverage hampir 0% di 3 dari 4 modul
- Code quality issues (duplicate code, as any, magic numbers)

---

## Fase 1 — Stabilitas (Target: Minggu 1-2)

**Goal:** Zero critical bugs, security hardened, basic test coverage

### Deliverables
- [ ] Semua bug CRITICAL dan HIGH fixed
- [ ] Rotated semua exposed credentials
- [ ] API test coverage ≥ 40%
- [ ] Unit test untuk dashboard hooks
- [ ] Unit test untuk web-gen generator
- [ ] Unit test untuk wa-bot main logic

### Metrics Target
- Bug critical: 0 (dari 2)
- Bug high: 0 (dari 4)
- Test coverage: ≥ 40% (dari <20%)
- Security issues: 0 (dari 5)

---

## Fase 2 — Kualitas (Target: Minggu 3-4)

**Goal:** Code quality production-grade, comprehensive error handling, performance baseline

### Deliverables
- [ ] Refactor `as any` casts ke type-safe alternatives
- [ ] Extract duplicate upload logic ke shared utility
- [ ] Fix semua code smells terdokumentasi
- [ ] Implement unified error handling di dashboard
- [ ] Tambah skeleton loading states
- [ ] Optimasi web-gen build pipeline (parallel, caching)
- [ ] Fix duplicate data fetching di dashboard
- [ ] API test coverage ≥ 60%
- [ ] Dashboard unit test coverage ≥ 50%

### Metrics Target
- Test coverage: ≥ 60%
- Code smells resolved: ≥ 80%
- Bundle size dashboard: < 300KB gzip
- Web-gen build time: < 60s (dari 5 menit)

---

## Fase 3 — Fitur (Target: Bulan 1-2)

**Goal:** Feature complete, advanced capabilities

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
- [ ] API test coverage ≥ 80%
- [ ] Dashboard test coverage ≥ 80%
- [ ] Web-gen test coverage ≥ 80%
- [ ] WA-bot test coverage ≥ 60%

### Metrics Target
- Test coverage: ≥ 80% all modules
- Feature completeness: ≥ 95%
- Template variants: 7 (dari 6)

---

## Fase 4 — Production Readiness (Target: Bulan 2-3)

**Goal:** Siap production, monitoring, CI/CD, disaster recovery

### Deliverables
- [ ] CI/CD pipeline (GitHub Actions)
  - Lint + TypeCheck + Test + Build + Docker push
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

### Metrics Target
- Uptime target: 99.5%
- P50 API latency: < 200ms
- P95 API latency: < 1000ms
- Lighthouse score dashboard: ≥ 90
- Lighthouse score generated website: ≥ 85
- E2E test coverage: ≥ 5 critical flows

---

## Visual Timeline

```
Minggu 1-2  ████████░░░░░░░░░░░░  Fase 1: Stabilitas
Minggu 3-4  ░░░░░░░░████████░░░░  Fase 2: Kualitas
Bulan 1-2   ░░░░░░░░░░░░░░██████  Fase 3: Fitur
Bulan 2-3   ░░░░░░░░░░░░░░░░░░██  Fase 4: Production
```

## Dependency Graph

```
Fase 1 (Stabilitas)
  └──► Fase 2 (Kualitas)
        └──► Fase 3 (Fitur)
              └──► Fase 4 (Production)
```

Tiap fase blocking untuk fase berikutnya. Tidak bisa lanjut sebelum fase sebelumnya selesai.
