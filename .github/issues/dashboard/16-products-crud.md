# DSH-16 — Products CRUD Page

## Deskripsi
Halaman manajemen produk: list, search, filter, create, edit, delete. Nyambung ke katalog WA dan Web Store.

## Task Checklist

### 1. Table/Card View
- [ ] Kolom: Foto, Nama, Kategori, Harga, Stok, Status, Aksi
- [ ] Product image thumbnail (40x40px, rounded)
- [ ] Harga format Rupiah
- [ ] Stock badge: Hijau (>10), Kuning (1-10), Merah (0)
- [ ] Status toggle: aktif/nonaktif (Switch component)
- [ ] Pagination: 10 items/page
- [ ] Sort by: nama, harga, stok (click header)
- [ ] Striped rows atau card alternatif

### 2. Search & Filter
- [ ] Search input dengan debounce 300ms (fetch dari API)
- [ ] Filter by kategori (dropdown)
- [ ] Filter by status (aktif/nonaktif/semua)
- [ ] "Clear filter" button
- [ ] Result count: "Menampilkan 8 dari 24 produk"

### 3. Create Product Modal
```
┌─────────────────────────────────────┐
│  Tambah Produk Baru                 │
│                                     │
│  Nama Produk *  [______________]    │
│  Deskripsi      [______________]    │
│  Harga *        [Rp           ]    │
│  Stok *         [0            ]    │
│  Kategori       [Makanan    ▼]     │
│  Foto Produk    [Choose File]      │
│                 [Preview Image]     │
│  Status         [Active  ●-------○] │
│                                     │
│  [Batal]           [Simpan]         │
└─────────────────────────────────────┘
```

- [ ] Modal/dialog (bukan page terpisah)
- [ ] Form fields: nama (required), deskripsi, harga (required, >0), stok, kategori (dropdown), foto (upload), status (switch)
- [ ] Validasi client-side dengan Zod
- [ ] Image upload dengan preview (drag & drop atau click)
- [ ] Submit → `POST /api/products`
- [ ] Success: toast "Produk berhasil ditambahkan", modal close, list refresh
- [ ] Error: "Gagal menyimpan produk. Coba lagi."

### 4. Edit Product Modal
- [ ] Sama seperti create, tapi pre-filled dengan data existing
- [ ] Submit → `PUT /api/products/:id`
- [ ] Image: bisa ganti atau biarkan yang lama

### 5. Delete Confirmation
- [ ] Click icon trash → confirm dialog
- [ ] "Yakin hapus [nama produk]? Produk akan dinonaktifkan, data pesanan tetap tersimpan."
- [ ] Cancel / Confirm buttons
- [ ] Confirm → `DELETE /api/products/:id`
- [ ] Success: toast + list refresh

### 6. Bulk Actions (Optional)
- [ ] Select multiple products → [Aktifkan] [Nonaktifkan] [Hapus]
- [ ] Select all checkbox

### 7. Empty State
```
┌──────────────────────────────────────┐
│                                      │
│     🛍️ Belum ada produk              │
│                                      │
│  Tambah produk pertama kamu untuk    │
│  mulai menerima pesanan via WA       │
│                                      │
│  [+ Tambah Produk Pertama]           │
└──────────────────────────────────────┘
```

### 8. Loading & Error
- [ ] Table skeleton: 10 baris placeholder
- [ ] Error state: "Gagal memuat produk" + retry button
- [ ] Empty search: "Tidak ada produk dengan kata kunci 'xxx'"

## Verification
- [ ] List produk muncul dengan pagination
- [ ] Search bekerja (delay 300ms)
- [ ] Create produk → muncul di list
- [ ] Edit produk → data berubah
- [ ] Delete → produk hilang dari list
- [ ] Toggle status → isAvailable berubah
- [ ] Filter by kategori bekerja

## Labels
`frontend`, `dashboard`, 🔴 high

## Dependencies
DSH-14

## Estimasi
1-2 hari
