# DSH-22 — WA Session Connection Page

## Deskripsi
Halaman untuk menghubungkan WhatsApp merchant ke WANI via QR code. Menampilkan status koneksi real-time, QR code scanner, dan panduan langkah demi langkah.

## Task Checklist

### 1. Connection Status Display
```
┌──────────────────────────────────────────────────────┐
│  Koneksi WhatsApp                                    │
│                                                     │
│  ┌─ Status ──────────────────────────────────────┐  │
│  │                                                 │  │
│  │     🟢 **Tersambung**                           │  │
│  │     Nomor: +62 812-3456-7890                    │  │
│  │     Tersambung sejak: 12 Mar 2025, 10:00        │  │
│  │                                                 │  │
│  │     [Putuskan Koneksi]  [Sambungkan Ulang]      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                     │
│  ATAU (jika belum connect):                          │
│                                                     │
│  ┌─ Scan QR Code ────────────────────────────────┐  │
│  │                                                 │  │
│  │              ┌──────────────┐                   │  │
│  │              │   QR CODE    │                   │  │
│  │              │  [████████]  │                   │  │
│  │              │  [████████]  │                   │  │
│  │              │  [████████]  │                   │  │
│  │              └──────────────┘                   │  │
│  │                                                 │  │
│  │  QR akan expired dalam 45 detik                 │  │
│  │  [Muat Ulang QR]                                │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- [ ] Status card dengan indikator:
  - 🟢 **Connected** — hijau
  - 🟡 **Connecting** — kuning, animasi loading
  - 🔴 **Disconnected** — merah
  - ⚠️ **Expired** — orange
- [ ] Nomor WA yang terhubung
- [ ] Timestamp: "Tersambung sejak..."
- [ ] Tombol action sesuai status

### 2. QR Code Display
- [ ] QR image (base64) dari `GET /api/wa-session/me/qr`
- [ ] Auto-refresh setiap 30 detik (atau saat expired)
- [ ] Timer: "QR akan expired dalam XX detik" dengan countdown
- [ ] Manual refresh button
- [ ] Loading: skeleton QR placeholder
- [ ] Error: "Gagal memuat QR. [Coba Lagi]"

### 3. Step-by-Step Guide
```
┌─ Cara Menghubungkan ───────────────────────────────┐
│  1. Buka WhatsApp di ponselmu                       │
│  2. Tap titik tiga ⋮ > Perangkat Tertaut            │
│  3. Tap "Tautkan Perangkat"                         │
│  4. Scan QR code di samping                         │
│  5. Selesai! Pesanan akan otomatis masuk.           │
└─────────────────────────────────────────────────────┘
```

- [ ] Step-by-step dengan icon
- [ ] Bahasa Indonesia yang jelas

### 4. Connection History
```
┌─ Riwayat Koneksi ───────────────────────────────────┐
│  📅 Hari ini                                        │
│  10:23  ✅ Connected                                 │
│  10:22  🔄 Reconnecting...                          │
│  10:21  ❌ Disconnected (network error)              │
│  09:15  ✅ Connected                                 │
│  09:14  🔄 Reconnecting (percobaan 2/10)            │
│                                                     │
│  [Muat Lebih Banyak]                                │
└─────────────────────────────────────────────────────┘
```

- [ ] Log aktivitas koneksi (dari ActivityLog)
- [ ] Timeline dengan timestamp
- [ ] Icon per event type
- [ ] Auto-scroll ke terbaru

### 5. Connection Actions
- [ ] **Connect**: Klik → `POST /api/wa-session/me/connect` → QR muncul
- [ ] **Disconnect**: Konfirmasi "Yakin putuskan koneksi WA?" → `POST /api/wa-session/me/disconnect`
- [ ] **Reconnect**: `POST /api/wa-session/me/connect` (ulang)
- [ ] **Refresh QR**: `GET /api/wa-session/me/qr` (muat ulang)

### 6. Auto-Refresh (Polling)
- [ ] Poll `GET /api/wa-session/me/status` setiap 5 detik
- [ ] Update UI real-time saat status berubah
- [ ] Stop polling saat halaman tidak aktif (visibility API)
- [ ] Resume polling saat halaman aktif kembali

### 7. Error & Edge Cases
- [ ] "WhatsApp sudah tersambung di perangkat lain" → error message
- [ ] "Koneksi terputus. Mencoba menyambungkan kembali..." → auto-reconnect info
- [ ] "QR expired. Silakan muat ulang."

## Verification
- [ ] Status koneksi tampil dengan benar
- [ ] QR code muncul dan auto-refresh
- [ ] Countdown timer berjalan
- [ ] Connect → QR muncul
- [ ] Disconnect → konfirmasi → status berubah
- [ ] History log terisi

## Labels
`frontend`, `dashboard`, `whatsapp`, 🟡 medium

## Dependencies
DSH-14, API-08

## Estimasi
1-2 hari
