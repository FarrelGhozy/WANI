# Katalog Bug — WANI

> **Total Bug Terdokumentasi:** 13
> **Ditemukan:** 2026-07-01 saat analisis mendalam

---

## Ringkasan

| ID | Severity | Modul | Judul | Status |
|----|----------|-------|-------|--------|
| BUG-001 | 🔴 CRITICAL | api | Password reset token dikembalikan di HTTP response | OPEN |
| BUG-002 | 🟡 HIGH | dashboard | `convLoading` selalu `false` | OPEN |
| BUG-003 | 🟡 HIGH | dashboard | ForgotPassword pakai mock setTimeout | OPEN |
| BUG-004 | 🟡 HIGH | api | `businessName` fallback ke nama model LLM | OPEN |
| BUG-005 | 🟡 HIGH | api | Stock tidak direstor saat order dicancel | OPEN |
| BUG-006 | 🟡 HIGH | wa-bot | Recursive reconnect tanpa guard | OPEN |
| BUG-007 | 🔴 CRITICAL | wa-bot | `process.exit(0)` race dengan `sock.logout()` | OPEN |
| BUG-008 | 🔴 CRITICAL | wa-bot | `.env` dengan live credentials committed | OPEN |
| BUG-009 | 🟢 MEDIUM | dashboard | Duplicate `useWaStatus` polling | OPEN |
| BUG-010 | 🟢 MEDIUM | web-gen | Hardcoded path `../../api/uploads/` | OPEN |
| BUG-011 | 🟢 MEDIUM | api | JWT secret hardcoded fallback | OPEN |
| BUG-012 | 🔵 LOW | web-gen | HTML unescaped di template engine | OPEN |
| BUG-013 | 🔵 LOW | wa-bot | Tidak ada Prisma disconnect di shutdown | OPEN |

---

## Quick Links

- [BUG-001](BUG-001-password-reset-token-leak.md) — Password reset token leak
- [BUG-002](BUG-002-convloading-stuck-false.md) — convLoading stuck false
- [BUG-003](BUG-003-forgot-password-mock.md) — ForgotPassword mock
- [BUG-004](BUG-004-business-name-fallback-model.md) — businessName fallback
- [BUG-005](BUG-005-stock-not-restored-cancel.md) — Stock not restored
- [BUG-006](BUG-006-wa-reconnect-leak.md) — WA reconnect leak
- [BUG-007](BUG-007-process-exit-race.md) — process.exit race
- [BUG-008](BUG-008-leaked-credentials.md) — Leaked credentials
- [BUG-009](BUG-009-duplicate-polling.md) — Duplicate polling
- [BUG-010](BUG-010-hardcoded-upload-path.md) — Hardcoded upload path
- [BUG-011](BUG-011-hardcoded-jwt-secret.md) — Hardcoded JWT secret
- [BUG-012](BUG-012-unescaped-html-template.md) — Unescaped HTML
- [BUG-013](BUG-013-no-prisma-disconnect.md) — No Prisma disconnect
