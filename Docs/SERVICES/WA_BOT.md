# Service: WA Bot (`wa-bot/`)

Bot WhatsApp berbasis **Baileys 7 (`baileys` 7.0.0-rc13)** + Prisma 7. Tugasnya sempit dan sengaja dibuat "bodoh": menerima pesan WhatsApp dan meneruskannya ke API, mengirim balasan AI, mengirim pesan dari dashboard, dan mengelola sesi (QR/pairing/reset). **Tidak ada logika bisnis di sini.**

---

## 1. Menjalankan

```bash
cd wa-bot
bun install
bun run prisma:generate
bun run prisma:migrate
bun run src/index.ts
```

Prasyarat: API harus jalan lebih dulu (`API_URL` + `API_TOKEN` valid), dan database `wa_bot` sudah ada (lihat `init-dbs.sh`).

| Script | Perintah |
|--------|----------|
| `bun run src/index.ts` | Start bot |
| `bun run prisma:generate` | Generate Prisma Client |
| `bun run prisma:migrate` | `prisma migrate dev` |
| `bun run prisma:deploy` | `prisma migrate deploy` |
| `bun run test` | `bun test test/` |
| `bun run build` | `bun build … --target bun` (beberapa dependency di-`--external`) |

---

## 2. Struktur

| File | Peran |
|------|-------|
| `src/index.ts` | Seluruh lifecycle: socket, event handler, polling, reconnect, shutdown |
| `src/services/whatsapp-auth.ts` | `usePrismaAuthState(prisma)` → `{ state, saveCreds }` implementasi `SignalKeyStore` |
| `src/config/db.ts` | Prisma singleton dengan adapter `@prisma/adapter-pg` |
| `prisma/models/creds.prisma` | Tabel `Creds` (`id` selalu `"pairing"`, kolom `data` JSON string) |
| `prisma/models/signal_key.prisma` | Tabel `SignalKey` (PK `[type, id]`, kolom `data`) |

Karena state auth disimpan di Postgres, sesi WhatsApp **tahan restart container** tanpa volume file.

---

## 3. Lifecycle

```
main()
 ├─ bila isResetRestart: hapus Creds + SignalKey, lalu lanjut
 ├─ usePrismaAuthState() → state + saveCreds
 ├─ makeWASocket({ auth, browser: Browsers.ubuntu("Firefox"), shouldSyncHistoryMessage: () => false })
 ├─ ev "creds.update" → saveCreds
 ├─ ev "connection.update" → (lihat §4)
 ├─ ev "messages.upsert" → (lihat §5)
 └─ setInterval(pollOutgoing, OUTGOING_POLL_INTERVAL) → (lihat §6)
```

`process.on("SIGINT" | "SIGTERM")` → bersihkan timer (poll & reconnect) → `prisma.$disconnect()` → `exit(0)`. Didaftarkan sekali (`cleanupRegistered`).

---

## 4. Event `connection.update`

| Kondisi | Aksi |
|---------|------|
| `qr` tersedia | Cetak QR di terminal (`qrcode-terminal`) + `POST /api/qr { qr }`; sekaligus panggil `checkAndGeneratePairingCode()` |
| `connection === "open"` **atau** `receivedPendingNotifications` | Reset counter reconnect, hitung nomor dari `sock.user.id`, `DELETE /api/qr`, `POST /api/qr { status:"connected", phone }` |
| `connection === "close"` | `POST /api/qr { status:"disconnected" }`. Bila alasan bukan *logged out* → reconnect |
| Reconnect | Backoff eksponensial `min(1000 · 2^n, 30s)`, maksimal **10 percobaan**; lebih dari itu → `process.exit(1)` |

Alasan *logged out* tidak di-reconnect (butuh scan ulang).

---

## 5. Pesan Masuk (`messages.upsert`)

Filter: hanya `type === "notify"`, buang `msg.key.fromMe`, buang pesan tanpa konten, dan hanya proses JID `@s.whatsapp.net` (memakai `remoteJidAlt` bila ada).

```
text = conversation ?? extendedTextMessage.text
phone = jid tanpa karakter non-digit
name  = msg.pushName ?? phone
   ↓
POST /api/chat { phone, name, text, waMsgId: msg.key.id }   (Bearer API_TOKEN)
   ↓
reply = data.data.reply
qrisImageUrl = data.data.qrisImageUrl
   ↓
qrisImageUrl ? sendMessage(jid, { image: { url: API_URL + qrisImageUrl }, caption: reply })
             : sendMessage(jid, { text: reply })
```

- Bila ada QRIS dan pengiriman gambar gagal → fallback kirim teks.
- Bila API error → kirim "Maaf, sistem sedang sibuk, coba sebentar lagi."
- **Bot tidak mengirim `ownerId`** — API menyelesaikannya lewat `getOwnerIdOrFirst()` (user pertama di DB). Untuk deployment multi-tenant dengan bot per toko, `ownerId` perlu dikirim eksplisit (endpoint sudah menerimanya).

---

## 6. Polling (`pollOutgoing` tiap `OUTGOING_POLL_INTERVAL`, default 3000 ms)

Tiga hal dikerjakan dalam satu interval, berurutan:

1. **`pollResetSignal()`** — hanya bila `connected`. Bila status API = `disconnected` **tanpa** `phone` dan **tanpa** `qr` (tanda reset dari dashboard) → `sock.logout()`, hentikan poll, `sock.end()`, set `isResetRestart = true`, lalu `main()` lagi setelah 1 detik. Creds akan dihapus di awal `main()`.
2. **`checkAndGeneratePairingCode()`** — bila `pairingPhone` ada dan `pairingCode` belum ada serta belum connected → `sock.requestPairingCode(pairingPhone)` → `POST /api/qr { pairingCode }`.
3. **Ambil & kirim pesan keluar** — `GET /api/outgoing` → untuk setiap `{ id, jid, text }`: `sendMessage(jid, { text })` lalu `PATCH /api/outgoing/:id/delivered`.

Error handling poll: pada error berturut-turut, interval diganti sementara dengan backoff eksponensial `min(3000 · 2^errors, 60_000)` ms; kembali normal setelah satu siklus sukses.

---

## 7. Alur Pairing & Reset (end-to-end)

| Skenario | Langkah |
|----------|---------|
| **Scan QR** | Bot cetak QR → `POST /api/qr` → dashboard poll `GET /api/qr` → QR muncul di tab WA Session |
| **Pairing code** | Dashboard `POST /api/qr/pairing { phone }` → simpan `pairingPhone` → bot memanggil `requestPairingCode` → `POST /api/qr { pairingCode }` → dashboard menampilkan kode. `POST /api/qr/refresh-pairing` mengosongkan kode agar dibuat ulang |
| **Reset sesi** | Dashboard `POST /api/qr/reset` → API mengosongkan `WaSession` **dan** menghapus `Creds`/`SignalKey` di DB bot via `WABOT_DATABASE_URL` → bot mendeteksi sinyal reset di `pollResetSignal()` → logout → restart socket dengan sesi bersih |

---

## 8. Konfigurasi

| Variabel | Wajib | Keterangan |
|----------|-------|------------|
| `API_URL` | ✅ | Base URL API, mis. `http://api:3001` |
| `API_TOKEN` | ✅ | Harus sama dengan `API_TOKEN` API |
| `OUTGOING_POLL_INTERVAL` | — | Default `3000` ms |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` | ✅ | Koneksi DB `wa_bot` (dipakai juga oleh `prisma.config.ts`) |

---

## 9. Test

`bun run test` menjalankan `test/whatsapp-auth.test.ts` (perilaku `SignalKeyStore`: baca/tulis batch key, hapus key, serta penyimpanan creds).

---

## 10. Batasan yang Perlu Diketahui

- Satu proses bot = satu nomor WhatsApp. State auth di DB memang dirancang untuk satu sesi (`Creds.id = "pairing"`).
- Bot menangani **teks** saja; media masuk (gambar/audio/dokumen) diabaikan karena `text` kosong.
- `shouldSyncHistoryMessage: () => false` → riwayat chat lama tidak diambil; konteks hanya dari pesan baru yang tersimpan di DB API.
- Pengiriman gambar QRIS memakai URL `API_URL + qrisImageUrl` (path `/uploads/...`), sehingga bot dan API harus saling terhubung.
- `.env.example` memuat `OWNER_ID` (commented) yang **tidak dibaca** kode — jangan diandalkan.
