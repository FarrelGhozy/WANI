# WST-25 — Product Catalog & Product Detail Page

## Deskripsi
Full product catalog page dengan search, filter, dan sort, plus product detail page dengan info lengkap.

## Task Checklist

### A. Product Catalog Page (`/store/[slug]/products`)

### 1. Layout
```
┌──────────────────────────────────────────────────────────┐
│  🏠 Warung Berkah  >  Produk                            │
│                                                          │
│  ┌──────────────────────┐ ┌──────────────────────────┐  │
│  │ Filter               │ │ Product Grid              │  │
│  │                      │ │                           │  │
│  │ Kategori:            │ │ [🔍 Cari produk...]       │  │
│  │ ☑ Semua              │ │                           │  │
│  │ ☐ Makanan            │ │ ┌────┐ ┌────┐ ┌────┐    │  │
│  │ ☐ Minuman            │ │ │    │ │    │ │    │    │  │
│  │                      │ │ │ P1 │ │ P2 │ │ P3 │    │  │
│  │ Urutkan:             │ │ │    │ │    │ │    │    │  │
│  │ [Terbaru ▼]          │ │ └────┘ └────┘ └────┘    │  │
│  │                      │ │ ┌────┐ ┌────┐ ┌────┐    │  │
│  │ [Terapkan] [Reset]   │ │ │    │ │    │ │    │    │  │
│  └──────────────────────┘ │ │ P4 │ │ P5 │ │ P6 │    │  │
│                           │ └────┘ └────┘ └────┘    │  │
│  Menampilkan 6 dari 24   │                           │  │
│                           │ ← Prev  1 2 3  Next →    │  │
│                           └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- [ ] Breadcrumb: Home > Products
- [ ] Product count: "Menampilkan 12 dari 48 produk"

### 2. Search
- [ ] Search input di atas product grid
- [ ] Real-time filtering (client-side atau server-side)
- [ ] Debounce 300ms
- [ ] Empty search: "Tidak ada produk dengan kata kunci 'xxx'"

### 3. Filters (Sidebar)
- [ ] Category filter: checkbox list
- [ ] Price range: min-max input
- [ ] Sort: Terbaru, Termurah, Termahal, Nama A-Z
- [ ] Mobile: filter sebagai bottom sheet / modal
- [ ] Apply / Reset buttons

### 4. Product Grid (sama seperti landing page)
- [ ] Reuse component dari landing page
- [ ] List view toggle (grid/list) optional

### 5. Pagination
- [ ] 12 products per page
- [ ] Page numbers with prev/next
- [ ] URL query params: `/products?page=2&category=makanan&sort=price_asc`

### B. Product Detail Page (`/store/[slug]/product/[id]`)

### 6. Layout
```
┌────────────────────────────────────────────────────────────┐
│  🏠 Warung Berkah  >  Makanan  >  Nasi Goreng              │
│                                                            │
│  ┌──────────────┐  ┌──────────────────────────────────┐    │
│  │              │  │  🍗 Nasi Goreng                   │    │
│  │   Image      │  │  Kategori: Makanan                │    │
│  │   Area       │  │                                   │    │
│  │              │  │  Rp15.000                         │    │
│  │              │  │  Stok: ✅ Tersedia                 │    │
│  │              │  │                                   │    │
│  └──────────────┘  │  Nasi goreng spesial dengan       │    │
│                    │  telur, ayam suwir, dan kerupuk    │    │
│                    │                                   │    │
│                    │  ┌──────────────────────────┐     │    │
│                    │  │ 💬 Pesan Lewat WhatsApp  │     │    │
│                    │  └──────────────────────────┘     │    │
│                    │                                   │    │
│                    │  🔗 Salin Tautan Produk            │    │
│                    └──────────────────────────────────┘    │
│                                                            │
│  ─── Produk Terkait ───────────────────────────────────    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                              │
│  │    │ │    │ │    │ │    │                              │
│  │ P1 │ │ P2 │ │ P3 │ │ P4 │                              │
│  └────┘ └────┘ └────┘ └────┘                              │
└────────────────────────────────────────────────────────────┘
```

- [ ] Breadcrumb: Home > Category > Product Name
- [ ] **Image**: large, centered, placeholder jika tidak ada
- [ ] **Product info**: name, category badge, price (large), stock status
- [ ] **Description**: full description (parsed with line breaks)
- [ ] **WA Button**: prominent, dengan pesan spesifik produk:
  ```
  wa.me/{phone}?text=Halo%20saya%20mau%20pesan%20Nasi%20Goreng%20-%20Rp15.000
  ```
- [ ] **Share**: "Salin Tautan" button (copy to clipboard)

### 7. Related Products
- [ ] Produk dari kategori yang sama (max 4)
- [ ] Product cards kecil
- [ ] Click → navigate ke product detail

### 8. SEO Per Product
- [ ] Meta title: "[Product Name] — [Store Name]"
- [ ] Meta description: potongan deskripsi produk
- [ ] Open Graph tags untuk social share
- [ ] JSON-LD structured data (Product schema)

## Verification
- [ ] Catalog page dengan search & filter
- [ ] Sort by price, name, newest
- [ ] Pagination bekerja dengan URL params
- [ ] Product detail dengan info lengkap
- [ ] WA button dengan pesan spesifik produk
- [ ] Related products muncul
- [ ] SEO meta tags sesuai produk

## Labels
`frontend`, `web-store`, 🟡 medium

## Dependencies
WST-24

## Estimasi
2 hari
