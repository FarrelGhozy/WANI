# DSH-16 — Products CRUD Page

## Task Checklist

### 1. Table View
- [x] Kolom: Nama (with thumbnail), Kategori, Harga, Stok (badge), Status, Aksi
- [x] Product image placeholder (40x40 rounded)
- [x] Harga format Rupiah
- [x] Stock badge: Hijau (>10), Kuning (1-10), Merah (0)
- [x] Status: Aktif/Nonaktif text
- [x] Pagination: 10 items/page with prev/next
- [x] Result count: "Menampilkan X dari Y produk"

### 2. Search & Filter
- [x] Search input with debounce 300ms
- [x] Filter by kategori (dropdown)
- [x] Filter by status (aktif/nonaktif/semua)
- [x] "Reset" button when any filter active
- [x] Result count indicator

### 3. Create Product Modal
- [x] Dialog with form: nama (req), deskripsi, harga (req, >0), stok, kategori, status switch
- [x] Client-side validation (required fields, positive price)
- [x] Submit POST /api/products
- [x] Success: modal close, list refresh
- [x] Error: inline error message

### 4. Edit Product Modal
- [x] Pre-filled with existing data
- [x] Submit PUT /api/products/:id
- [x] Same validation as create

### 5. Delete Confirmation
- [x] Confirm dialog: "Yakin hapus [nama]?"
- [x] Cancel / Confirm buttons
- [x] DELETE /api/products/:id
- [x] Success: dialog close, list refresh

### 6. Empty State
- [x] "Belum ada produk" icon + CTA
- [x] Empty search: "Tidak ada produk dengan kata kunci"

### 7. Backend Enhancements
- [x] Added search/filter/categoryId/isAvailable query params to GET /api/products
- [x] Created category.service.ts (listCategories)
- [x] Created categories route at GET /api/categories
- [x] Registered categoriesRouter in server.ts

## Verification
- [x] Build succeeds
- [x] All 32 tests pass

## Labels
`frontend`, `dashboard`, 🔴 high

## Dependencies
DSH-14, API-06
