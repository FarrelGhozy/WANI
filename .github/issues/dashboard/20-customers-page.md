# DSH-20 — Customers Page

## Deskripsi
Halaman data pelanggan: list, search, detail, dan riwayat transaksi.

## Task Checklist

### 1. Customer List
```
┌──────────────────────────────────────────────────────┐
│  Customers                          [🔍 Cari nama...]│
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ 👤 BS  Budi Santoso   │ 5 order  │ Rp230.000 │   │
│  │       +62 812-3456-7890│ Sejak    │ [Detail]  │   │
│  │                        │ 12 Mar   │           │   │
│  ├──────────────────────────────────────────────┤   │
│  │ 👤 SW  Sari Wijaya    │ 3 order  │ Rp150.000 │   │
│  │       +62 812-3456-7891│ Sejak    │ [Detail]  │   │
│  │                        │ 15 Mar   │           │   │
│  ├──────────────────────────────────────────────┤   │
│  │ ...                                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Menampilkan 8 dari 24 pelanggan  ← Prev Next →     │
└──────────────────────────────────────────────────────┘
```

- [ ] Avatar lingkaran dengan inisial (2 huruf)
- [ ] Nama, nomor WA (format: +62 xxx-xxxx-xxxx)
- [ ] Total orders count
- [ ] Total spending (format Rupiah)
- [ ] Bergabung sejak (tanggal)
- [ ] Click → detail modal

### 2. Search
- [ ] Search by nama atau nomor WA
- [ ] Debounce 300ms
- [ ] Empty search: "Tidak ada pelanggan dengan kata kunci 'xxx'"

### 3. Customer Detail Modal
```
┌─── Detail Pelanggan ─────────────────────────────┐
│  👤 Budi Santoso                                 │
│  📞 +62 812-3456-7890                            │
│  🗓️ Pelanggan sejak: 12 Maret 2025               │
│                                                   │
│  📊 Statistik                                     │
│  ┌────────────────────────────────────────┐       │
│  │ Total Orders: 5   Total: Rp230.000     │       │
│  └────────────────────────────────────────┘       │
│                                                   │
│  📋 Riwayat Pesanan                               │
│  ┌────────────────────────────────────────┐       │
│  │ #ORD-1023  12 Mar  Rp45.000  🟡        │       │
│  │ #ORD-1015  10 Mar  Rp120.000 🔵        │       │
│  │ #ORD-1002  8 Mar   Rp25.000  ✅        │       │
│  └────────────────────────────────────────┘       │
│                                                   │
│  📝 Catatan: [___________]  [Simpan]              │
└───────────────────────────────────────────────────┘
```

- [ ] Customer profile info
- [ ] Stats card: total orders, total spending
- [ ] Order history list (5 terbaru)
- [ ] Click order → navigate ke order detail
- [ ] Notes field: simpan catatan tentang customer

### 4. Sort Options
- [ ] Sort by: Nama, Total Orders, Bergabung
- [ ] Direction: ascending/descending

## Verification
- [ ] List customer muncul dengan pagination
- [ ] Search by name bekerja
- [ ] Detail modal muncul dengan info lengkap
- [ ] Order history list muncul

## Labels
`frontend`, `dashboard`, 🟡 medium

## Dependencies
DSH-14

## Estimasi
1 hari
