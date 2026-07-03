# Tahap 1 — Stabilitas

> **Prioritas:** 🟡 ~65% complete (2026-07-03)
> **Target:** Minggu 1-2
> **Goal:** Zero critical bugs, security hardened, basic test coverage
> 
> **Progress:** Test infrastructure ✅ (API 82%, dashboard 97 tests, web-gen 82%).  
> Bug fixing masih pending untuk BUG-001, BUG-007, BUG-008 (CRITICAL).

## Overview

Tahap ini fokus pada perbaikan bug dan security issues yang ditemukan selama analisis mendalam. Tidak ada fitur baru — hanya stabilisasi.

## Deliverables

| # | Item | Tipe | Estimasi |
|---|------|------|----------|
| 1 | Fix semua bug CRITICAL (2 bug) | Bug Fix | 2 jam |
| 2 | Fix semua bug HIGH (4 bug) | Bug Fix | 4 jam |
| 3 | Rotate exposed credentials | Security | 1 jam |
| 4 | Tambah test coverage API ≥ 40% | Testing | 8 jam |
| 5 | Tambah unit test dashboard hooks | Testing | 6 jam |
| 6 | Tambah unit test web-gen generator | Testing | 4 jam |
| 7 | Tambah unit test wa-bot main logic | Testing | 4 jam |

## Dokumen Terkait

- [Katalog Bug](../bug/README.md) — Semua bug terdokumentasi
- [Security Fixes](02-security-fixes.md) — Rencana perbaikan keamanan
- [Test Infrastructure](03-test-infrastructure.md) — Rencana implementasi test

## Urutan Pengerjaan

### Hari 1 — Security Emergency
1. **BUG-008**: Rotate semua credentials yang ter-expose di wa-bot/.env
2. **BUG-001**: Fix password reset token leak di API
3. **BUG-004**: Fix businessName fallback ke model LLM
4. **BUG-007**: Fix process.exit race condition di wa-bot

### Hari 2 — Bug Fixing
5. **BUG-006**: Fix recursive reconnect leak di wa-bot
6. **BUG-002**: Fix convLoading stuck false di dashboard
7. **BUG-009**: Fix duplicate polling di dashboard
8. **BUG-005**: Fix web-gen hardcoded upload path

### Hari 3-5 — Testing API
9. Integration tests untuk API endpoints
10. Unit tests untuk AI engine dan circuit breaker
11. Unit tests untuk models
12. Unit tests untuk middleware

### Hari 6-8 — Testing Dashboard & Web-Gen
13. Unit tests untuk hooks (useProducts, useOrders, useCustomers)
14. Unit tests untuk web-gen template engine
15. Unit tests untuk generator.ts

### Hari 9-10 — Testing WA-Bot
16. Unit tests untuk index.ts (socket handlers, polling)
17. Integration tests untuk API bridge

## Definition of Done

- [ ] `bun test` di api/ → 0 failures, coverage ≥ 40%
- [ ] `bun test` di dashboard/ → 0 failures
- [ ] `bun test` di web-gen/ → 0 failures
- [ ] `bun test` di wa-bot/ → 0 failures
- [ ] Tidak ada bug CRITICAL atau HIGH tersisa
- [ ] Semua credential sudah dirotate
- [ ] Tidak ada hardcoded secrets di codebase
- [ ] `.env` tidak ada di git tracking
