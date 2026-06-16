# DSH-15 — Overview Page: Stats, Recent Orders, Activity

## Deskripsi
Halaman utama dashboard yang menampilkan ringkasan bisnis: statistik real-time, order terbaru, dan aktivitas terbaru.

## Task Checklist

### 1. Layout
```
┌─────────────────────────────────────────────────────┐
│  Selamat Datang, Warung Berkah!   📅 12 Mar 2025    │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Total    │ │ Revenue  │ │ AI Handle│ │ Growth │ │
│  │ Order: 47│ │ Rp12.5jt │ │ 92%      │ │ +15%   │ │
│  │ 📦       │ │ 💰       │ │ 🤖       │ │ 📈     │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                     │
│  ┌─ Order Baru ─────────────┐ ┌─ Aktivitas ──────┐ │
│  │ #1023 Budi   Rp45k 🟡    │ │ 10:23 Order #1023│ │
│  │ #1022 Sari   Rp120k 🔵   │ │ 10:15 AI Chat    │ │
│  │ #1021 Adi    Rp25k 🟡    │ │ 10:00 Order #1022│ │
│  │ [Lihat Semua →]          │ │ [Lihat Semua →]  │ │
│  └──────────────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2. Data Fetching
- [ ] Fetch: `GET /api/dashboard/stats` → stat cards
- [ ] Fetch: `GET /api/dashboard/recent-orders?limit=5`
- [ ] Fetch: `GET /api/dashboard/activity?limit=8`
- [ ] Parallel fetching dengan Promise.all
- [ ] Auto-refresh setiap 30 detik (polling)
- [ ] Error handling: kalo gagal fetch, tampilkan data terakhir atau error message

### 3. Stat Cards
- [ ] 4 cards: Total Order, Revenue (bulan ini), AI Handle Rate, Growth %
- [ ] Icon berbeda tiap card
- [ ] Revenue: format Rupiah (pakai `Intl.NumberFormat`)
- [ ] AI Handle Rate: progress bar visual
- [ ] Growth: hijau kalo positif, merah kalo negatif, dengan arrow icon
- [ ] Skeleton loading saat fetch
- [ ] Hover effect: slight elevation

### 4. Recent Orders
- [ ] List 5 order terbaru
- [ ] Tampilkan: order number, customer name, amount, status badge
- [ ] Status badge dengan warna: 🟡 Pending, 🔵 Confirmed, 🟠 Processing, 🟢 Completed, 🔴 Cancelled
- [ ] Click → navigate ke `/dashboard/orders` (atau ke detail)
- [ ] Empty state: "Belum ada order. Scan QR WA untuk mulai."

### 5. Recent Activity
- [ ] Stream 8 aktivitas terbaru
- [ ] Icon berbeda tiap tipe aktivitas (order, chat, payment, dll)
- [ ] Timestamp relatif: "2 menit yang lalu", "1 jam yang lalu"
- [ ] Auto-scroll kalo ada aktivitas baru

### 6. Empty State
- [ ] Kalo merchant baru daftar dan belum ada data:
  ```
  ┌──────────────────────────────────────┐
  │                                      │
  │         🎉 Selamat Datang!           │
  │                                      │
  │  Mulai dengan:                       │
  │  1. Connect WhatsApp (scan QR)      │
  │  2. Tambah produk                   │
  │  3. Bagikan nomor WA ke pelanggan   │
  │                                      │
  │  [Connect WA]  [Tambah Produk]       │
  └──────────────────────────────────────┘
  ```

### 7. Loading & Error States
- [ ] Skeleton: 4 card placeholder + 2 list placeholder
- [ ] Error: "Gagal memuat data. [Coba lagi]" button
- [ ] Partial loading: kalo stats gagal tapi orders berhasil, tetap tampilkan orders

## Verification
- [ ] 4 stat cards muncul dengan data real
- [ ] Revenue format Rupiah benar
- [ ] Recent orders list dengan status badge
- [ ] Activity stream terisi
- [ ] Skeleton loading muncul sebelum data
- [ ] Auto-refresh bekerja

## Labels
`frontend`, `dashboard`, 🔴 high

## Dependencies
DSH-14, API-07

## Estimasi
1 hari
