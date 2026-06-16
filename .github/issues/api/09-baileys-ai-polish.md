# API-09 — Baileys & AI Pipeline Bug Fixes + Polish

## Deskripsi
Issue terakhir untuk backend — memastikan Baileys integration dan AI pipeline berfungsi dengan baik di semua skenario. Fokus pada bug fixing, edge cases, dan error handling.

## Task Checklist

### 1. Multi-Merchant Support di Baileys
- [ ] Refactor `BaileysManager` untuk support multiple merchant connections
- [ ] Buat Map: `Map<merchantId, BaileysManager>` — tiap merchant punya instance sendiri
- [ ] Pastikan cleanup saat merchant dihapus atau disconnect
- [ ] Test: connect 2 merchant berbeda → both connected

### 2. Baileys Connection Robustness
- [ ] Fix: reconnect setelah network drop (current exponential backoff)
- [ ] Fix: session expired → rescan QR
- [ ] Fix: handle `connection.update` events: `open`, `close`, `connecting`, `logout`
- [ ] Pastikan `sendText` error handling: kalo WA disconnect, jangan throw, tapi queue & retry
- [ ] Rate limiting: WA punya limit sendiri, jangan spam messages

### 3. AI Pipeline Edge Cases
- [ ] Empty product list → AI harus reply "Maaf, belum ada produk tersedia"
- [ ] LLM timeout (slow response) → fallback ke offline message dalam 15 detik
- [ ] LLM return invalid JSON → retry dengan error feedback (max 2x)
- [ ] LLM return product name yang tidak ada di DB → "Maaf, produk tidak ditemukan"
- [ ] AI Agent disabled → semua message langsung ke admin/human

### 4. Message Pipeline Fixes
- [ ] Dedup: pastikan message ID benar-benar unique (cek existing messages)
- [ ] Conversation status check: kalo RESOLVED/ARCHIVED, jangan AI reply
- [ ] Order parsing: validasi stock cukup sebelum transaction
- [ ] Escalation: setelah di-escalate, AI harus silent sampai di-resolve

### 5. Transaction Integrity
- [ ] Review semua `prisma.$transaction()` — pastikan rollback kalau ada error
- [ ] Stock decrement: jangan sampai negative stock
- [ ] Payment: jangan sampai double payment untuk order yang sama
- [ ] ActivityLog: semua event penting harus tercatat

### 6. Logging & Monitoring
- [ ] Tambah logging untuk: connection changes, LLM calls, order creations, errors
- [ ] Jangan log: API keys, JWT tokens, WA auth credentials
- [ ] Pastikan Pino logger terintegrasi di semua service

## Verification
- [ ] 2 merchant bisa connect WA bersamaan
- [ ] Disconnect → reconnect otomatis dalam 60 detik
- [ ] AI reply proper untuk semua intent (order, inquiry, greeting, complaint)
- [ ] Transaction rollback kalau order gagal
- [ ] ActivityLog terisi untuk semua event

## Labels
`api`, `baileys`, `ai`, `polish`, 🟡 medium

## Dependencies
FND-02

## Estimasi
2 hari
