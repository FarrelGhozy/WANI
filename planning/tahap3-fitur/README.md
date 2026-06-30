# Tahap 3 — Fitur

> **Prioritas:** 🟢 PENGEMBANGAN
> **Target:** Bulan 1-2
> **Goal:** Feature complete, advanced capabilities (RAG, multi-store, email)

## Overview

Setelah codebase stabil (Tahap 1) dan berkualitas (Tahap 2), Tahap 3 fokus pada penambahan fitur-fitur yang masih missing dan meningkatkan kapabilitas platform secara signifikan.

## Deliverables

| # | Item | Modul | Estimasi |
|---|------|-------|----------|
| 1 | Email system (SMTP) | api | 8 jam |
| 2 | Refresh token mechanism | api | 4 jam |
| 3 | RAG / Vector store untuk AI | api | 16 jam |
| 4 | Product search di HTML templates | web-gen | 4 jam |
| 5 | Dynamic features section | web-gen | 4 jam |
| 6 | Elegant template | web-gen | 8 jam |
| 7 | Multi-store support (schema + API) | api | 12 jam |
| 8 | Multi-store UI | dashboard | 8 jam |
| 9 | Analytics dashboard page | dashboard | 12 jam |
| 10 | RBAC (admin + staff roles) | api + dashboard | 12 jam |
| 11 | API test coverage → 80% | api | 16 jam |
| 12 | Dashboard test coverage → 80% | dashboard | 16 jam |
| 13 | Web-gen test coverage → 80% | web-gen | 12 jam |
| 14 | WA-bot test coverage → 60% | wa-bot | 8 jam |

## Dokumen Terkait

- [Email System](01-email-system.md) — Implementasi SMTP
- [RAG Knowledge Base](02-rag-knowledge-base.md) — Vector store untuk AI
- [Website Generator Improvements](03-website-generator.md) — Web-gen enhancements
- [Multi-Store Support](04-multi-store.md) — Arsitektur multi-toko

---

## Prioritas Fitur

### Must Have (harus selesai)
1. Email system — untuk forgot password flow yang proper
2. RAG / Vector store — upgrade AI capability secara signifikan
3. Multi-store support — arsitektur yang lebih scalable
4. Test coverage ≥ 80% — production quality

### Should Have (penting)
5. Dynamic features section di website
6. Product search di HTML templates
7. Analytics dashboard
8. Refresh token mechanism

### Nice to Have (jika waktu cukup)
9. Elegant web-gen template
10. RBAC granular
11. Push webhook untuk outgoing messages
12. Multi-device WA session backup

---

## Definition of Done — Tahap 3

- [ ] Email forgot password berfungsi (terima email + reset password)
- [ ] RAG memberikan jawaban yang lebih akurat berdasarkan knowledge base
- [ ] Multi-store: bisa manage > 1 toko dari 1 dashboard
- [ ] Seluruh test coverage ≥ 80% untuk semua modul
- [ ] Semua fitur baru punya test
- [ ] Dokumentasi API update untuk fitur baru
