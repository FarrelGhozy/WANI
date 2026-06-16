# DSH-17 — Orders Management Page

## Deskripsi
Halaman manajemen order: list semua order dari WA dan Web Store, filter by status, detail order, dan transisi status (Confirm, Process, Complete, Cancel).

## Task Checklist

### 1. Orders List
```
┌──────────────────────────────────────────────────────────────┐
│  Orders                                   [🔍 Search...]     │
│                                                              │
│  [🟡 Pending] [🔵 Confirmed] [🔄 Processing] [✅ Completed] │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ #ORD-1023 │ Budi   │ Rp45.000 │ 🟡 Pending  │ 10:23 │    │
│  │ 3 items   │ WA Chat│          │ 30 menit    │ [▶]   │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ #ORD-1022 │ Sari   │ Rp120.000│ 🔵 Confirmed│ 09:15 │    │
│  │ 2 items   │ Web    │          │ 2 jam       │ [▶]   │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ ...                                                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ← Prev  1 2 3 ... 10  Next →                                │
└──────────────────────────────────────────────────────────────┘
```

- [ ] Cards atau table rows per order
- [ ] Order number (auto-increment atau UUID pendek)
- [ ] Customer name, jumlah item, total amount
- [ ] Status badge dengan warna konsisten
- [ ] Source badge: "WA Chat" (green) atau "Web Store" (blue)
- [ ] Waktu: format relatif ("10 menit yang lalu")
- [ ] Search by order number atau customer name

### 2. Status Tabs
- [ ] Tab bar: Semua | Pending | Confirmed | Processing | Completed | Cancelled
- [ ] Masing-masing tab punya count badge: "Pending (12)"
- [ ] Click → filter orders by status
- [ ] URL query param: `/dashboard/orders?status=PENDING`

### 3. Order Detail Panel (Expandable / Slide-over)
```
┌─── Order Detail ─────────────────────────────────┐
│  #ORD-1023                                       │
│  Status: 🟡 Pending                              │
│                                                   │
│  👤 Customer                                      │
│  Nama: Budi Santoso                               │
│  WA: +62 812-3456-7890                            │
│                                                   │
│  📋 Items                                         │
│  ┌────────────────────────────────────────┐       │
│  │ Nasi Goreng     x2     Rp15.000 → Rp30k│       │
│  │ Es Teh Manis    x1     Rp5.000  → Rp5k │       │
│  ├────────────────────────────────────────┤       │
│  │ Total                         Rp35.000│       │
│  └────────────────────────────────────────┘       │
│                                                   │
│  💳 Payment: Pending (Cash)                       │
│                                                   │
│  📝 Notes: "Kak, ini udah termasuk ongkir?"       │
│                                                   │
│  ⏱ Timeline                                       │
│  ┌────────────────────────────────────────┐       │
│  │ 10:23 Order dibuat via WA Chat         │       │
│  └────────────────────────────────────────┘       │
│                                                   │
│  Actions: [✅ Confirm] [❌ Cancel]                 │
└───────────────────────────────────────────────────┘
```

- [ ] Slide-over panel atau expandable section
- [ ] Customer info (nama, WA)
- [ ] Items list (nama produk, qty, unit price, subtotal)
- [ ] Total amount
- [ ] Payment info (method, status)
- [ ] Notes dari customer
- [ ] Timeline: log transisi status
- [ ] Action buttons sesuai status

### 4. Status Actions
- [ ] PENDING → [Confirm] [Cancel]
- [ ] CONFIRMED → [Process] [Cancel]
- [ ] PROCESSING → [Complete] [Cancel]
- [ ] COMPLETED → (no actions)
- [ ] CANCELLED → (no actions)
- [ ] Transisi: `PUT /api/orders/:id/status` dengan body `{ status: "CONFIRMED" }`
- [ ] Confirm cancel: dialog "Yakin batalkan order #ORD-1023?"
- [ ] Toast feedback: "Order #ORD-1023 berhasil dikonfirmasi"

### 5. Filters & Sorting
- [ ] Time filter: Hari ini, 7 hari, 30 hari, Semua
- [ ] Source filter: WA Chat, Web Store, Semua
- [ ] Sort by: Terbaru, Tertua, Total tertinggi
- [ ] Reset filters button

### 6. Empty States
- [ ] No orders: "Belum ada pesanan. Bagikan nomor WA ke pelanggan."
- [ ] No matching filter: "Tidak ada order dengan status ini"

## Verification
- [ ] List orders muncul dengan pagination
- [ ] Status tabs filter dengan benar
- [ ] Order detail panel muncul dengan info lengkap
- [ ] Confirm order → status berubah, UI update
- [ ] Cancel order → confirm dialog, status berubah
- [ ] Invalid transition → error toast

## Labels
`frontend`, `dashboard`, 🔴 high

## Dependencies
DSH-14

## Estimasi
1-2 hari
