# Katalog Bug — Tahap 1

> Ringkasan semua bug yang harus difix di Tahap 1.
> Detail masing-masing bug ada di [../bug/](../bug/README.md)

---

## Daftar Bug berdasarkan Severity

### 🔴 CRITICAL (Blocker — Harus difix sebelum apapun)

| ID | Modul | Judul | File |
|----|-------|-------|------|
| BUG-001 | api | Password reset token dikembalikan di HTTP response | `api/src/controllers/auth.ts:108` |
| BUG-008 | wa-bot | `.env` dengan live credentials committed ke git | `wa-bot/.env` |

### 🟡 HIGH (Harus difix di tahap ini)

| ID | Modul | Judul | File |
|----|-------|-------|------|
| BUG-002 | dashboard | `convLoading` selalu `false` | `dashboard/src/hooks/useCustomers.ts:14` |
| BUG-003 | dashboard | ForgotPassword pakai mock, bukan API call | `dashboard/src/pages/ForgotPasswordPage.tsx:28` |
| BUG-004 | api | `businessName` fallback ke nama model LLM | `api/src/ai/pipeline/steps/contextLoader.ts:40` |
| BUG-005 | api | Stock tidak direstor saat order dicancel | `api/src/controllers/orders.ts` |
| BUG-006 | wa-bot | Recursive reconnect tanpa guard | `wa-bot/src/index.ts:77` |
| BUG-007 | wa-bot | `process.exit(0)` race dengan `sock.logout()` | `wa-bot/src/index.ts:138-139` |

### 🟢 MEDIUM (Difix jika waktu cukup)

| ID | Modul | Judul | File |
|----|-------|-------|------|
| BUG-009 | dashboard | Duplicate `useWaStatus` polling | `dashboard/src/hooks/useWaStatus.ts` |
| BUG-010 | web-gen | Hardcoded path ke `../../api/uploads/` | `web-gen/src/generator.ts:371` |
| BUG-011 | api | JWT secret hardcoded fallback | `api/src/middleware/jwt.ts:5` |

### 🔵 LOW (Dicatat, difix nanti)

| ID | Modul | Judul |
|----|-------|-------|
| BUG-012 | web-gen | HTML unescaped di template engine |
| BUG-013 | wa-bot | Tidak ada Prisma disconnect di shutdown |

---

## Quick Reference — Lokasi Bug di Kode

```
api/src/controllers/auth.ts:108          ← BUG-001 (Password reset token leak)
api/src/ai/pipeline/steps/contextLoader.ts:40  ← BUG-004 (businessName fallback)
api/src/middleware/jwt.ts:5              ← BUG-011 (Hardcoded JWT secret)
api/src/controllers/orders.ts            ← BUG-005 (Stock not restored)
dashboard/src/hooks/useCustomers.ts:14   ← BUG-002 (convLoading stuck)
dashboard/src/pages/ForgotPasswordPage.tsx:28 ← BUG-003 (Mock forgot password)
dashboard/src/hooks/useWaStatus.ts       ← BUG-009 (Duplicate polling)
wa-bot/src/index.ts:77                   ← BUG-006 (Recursive reconnect)
wa-bot/src/index.ts:138-139              ← BUG-007 (process.exit race)
wa-bot/.env                              ← BUG-008 (Leaked credentials)
web-gen/src/generator.ts:371             ← BUG-010 (Hardcoded path)
web-gen/src/generator.ts:124             ← BUG-012 (Unescaped HTML)
wa-bot/src/index.ts                      ← BUG-013 (No Prisma disconnect)
```
