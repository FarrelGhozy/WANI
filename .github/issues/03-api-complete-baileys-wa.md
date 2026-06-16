# Issue #3 — Complete & Polish Express Backend + Baileys WA Integration

## Deskripsi
Backend Express sudah memiliki ~4.400 baris kode real dan sebagian besar logic sudah jadi. Issue ini bertujuan untuk:
1. Memastikan semua service/routes bisa diakses dan berfungsi dengan benar
2. Menambahkan endpoint yang masih kurang (Web Store API, WA Session management, dashboard stats)
3. Memperbaiki potential bugs di Baileys integration
4. Menambahkan error handling yang lebih robust

## Task Checklist

### 1. Audit & Fix Existing Code
- [ ] Review semua route handlers — pastikan response konsisten (`ApiResponse` type)
- [ ] Review semua service — pastikan error handling pakai try-catch + proper logging
- [ ] Pastikan Prisma transaction dipake di semua operasi yang membutuhkan atomicity
- [ ] Cek edge cases: merchantId injection via JWT middleware, empty result sets, dll
- [ ] Fix potential issues di `src/baileys/auth.ts` — encrypt/decrypt creds
- [ ] Fix potential issues di `src/baileys/manager.ts` — singleton pattern, cleanup on disconnect

### 2. Web Store API Endpoints (Baru)
Buat routes + service untuk Web Store management:

- [ ] `GET /api/web-store/:merchantId` — ambil config web store
- [ ] `PUT /api/web-store/:merchantId` — update config web store (slug, template, theme, SEO)
- [ ] `POST /api/web-store/:merchantId/publish` — publish/unpublish web store
- [ ] `GET /api/web-store/:merchantId/preview` — preview data yang akan di-generate
- [ ] `GET /api/templates` — list available templates
- [ ] Service: `src/services/web-store.service.ts`

### 3. WA Session Management API (Improvement)
- [ ] `POST /api/wa-session/:merchantId/connect` — initiate koneksi WA
- [ ] `GET /api/wa-session/:merchantId/qr` — ambil QR code terbaru (base64)
- [ ] `POST /api/wa-session/:merchantId/disconnect` — disconnect session
- [ ] `GET /api/wa-session/:merchantId/status` — status koneksi real-time
- [ ] Pastikan session bisa di-reconnect dari dashboard nanti

### 4. Dashboard Stats API (Baru)
- [ ] `GET /api/dashboard/stats` — aggregate stats: total orders, revenue, growth, handle rate
- [ ] `GET /api/dashboard/recent-orders` — 5 order terbaru untuk overview
- [ ] `GET /api/dashboard/activity` — activity log terbaru
- [ ] Service: `src/services/dashboard.service.ts`

### 5. Baileys Integration Testing & Polish
- [ ] Test: connect ke nomor WA beneran (development)
- [ ] Test: send message dari bot
- [ ] Test: receive message → masuk pipeline
- [ ] Test: reconnect setelah disconnect
- [ ] Test: expired session → QR rescan
- [ ] Fix: handling multiple merchant connections (current code is singleton)

### 6. AI Pipeline Refinement
- [ ] Test: intent classification with real LLM call
- [ ] Test: order parsing dan validasi
- [ ] Test: fallback chain (primary → fallback → offline)
- [ ] Test: escalation flow
- [ ] Pastikan `knowledge_base` dan `system_prompt` bisa diupdate via dashboard nanti

## File yang Perlu Diubah/Dibuat
```
apps/api/src/
├── routes/
│   ├── web-store.routes.ts       # NEW
│   ├── dashboard.routes.ts       # NEW
│   ├── wa-session.routes.ts      # NEW (atau improve existing)
│   └── index.ts                  # UPDATE — register new routes
├── services/
│   ├── web-store.service.ts      # NEW
│   ├── dashboard.service.ts      # NEW
│   └── index.ts                  # UPDATE
└── server.ts                     # UPDATE — register new routers
```

## Definition of Done
- Semua existing routes passing manual test
- Web Store API bisa create/read/update/publish config
- Dashboard stats API return data agregat real-time
- WA session management bisa connect/disconnect via API
- AI pipeline bisa handle incoming WA message end-to-end
- Semua error cases ter-handle dengan proper HTTP status codes

## Labels
`api`, `backend`, `wa-integration`, `high-priority`

## Dependencies
- Issue #1 (Monorepo) — struktur folder
- Bisa dikerjakan paralel dengan Issue #2 (Docker)

## Estimated Effort
3-4 hari
