# DSH-17 — Orders Management Page

## Task Checklist

### 1. Orders List
- [x] Order cards with: ID, customer name, item count, total amount
- [x] Status badge with consistent colors
- [x] Source badge: "WA Chat" / "Web Store" with icons
- [x] Relative time: "10 menit yang lalu"
- [x] Search by customer name or order ID

### 2. Status Tabs
- [x] Tab bar: Semua | Pending | Dikonfirmasi | Diproses | Selesai | Dibatalkan
- [x] Click tab → filter by status (URL query param)
- [x] Default "Semua" shows all

### 3. Order Detail Slide-over Panel
- [x] Slide-over from right with full order detail
- [x] Customer info (name, WA)
- [x] Items list (product name, qty, unit price, subtotal)
- [x] Total amount
- [x] Payment info (method, status)
- [x] Customer notes
- [x] Action buttons per status

### 4. Status Actions
- [x] PENDING → [Konfirmasi] [Batalkan]
- [x] CONFIRMED → [Proses] [Batalkan]
- [x] PROCESSING → [Selesaikan] [Batalkan]
- [x] COMPLETED → (no actions)
- [x] CANCELLED → (no actions)
- [x] Transitions via PUT /api/orders/:id/status
- [x] Confirm cancel dialog
- [x] Success: detail close, list refresh

### 5. Pagination
- [x] 10 items per page
- [x] Prev/Next buttons
- [x] "Hal X dari Y" indicator

### 6. Empty States
- [x] No orders: "Belum ada pesanan"
- [x] No matching filter: "Tidak ada hasil"

## Labels
`frontend`, `dashboard`, 🔴 high

## Dependencies
DSH-14
