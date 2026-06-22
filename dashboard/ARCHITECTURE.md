# WANI Dashboard — Architecture

> Dashboard admin untuk platform omnichannel UMKM. Bagian dari proyek WANI (WA + Niaga).

---

## Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| **Runtime** | Bun | 1.3.x |
| **UI** | React | 19.2.7 |
| **Bundler** | Vite (Rolldown) | 8.0.16 |
| **TypeScript** | TypeScript | 6.0.3 |
| **CSS** | Tailwind CSS | 4.3.1 |
| **Routing** | React Router | 8.0.1 |
| **QR** | qrcode.react | 4.2.0 |
| **Lint** | ESLint | 10.5.0 |
| **TS Lint** | typescript-eslint | 8.61.1 |
| **Compiler** | React Compiler (Babel) | 1.0.0 |

### Prinsip Stack

- **No downgrade**. Jika ada error/bug, cari solusi via searching — bukan turunin versi package.
- **Latest stable**. Selalu pakai latest stable version yang sudah diverifikasi dari npm resmi.
- **Rolldown, not esbuild**. Vite 8 menggunakan Rolldown sebagai bundler production.

---

## Visual Design System

### Arah Visual: "Warm Teal + Amber"

Dashboard dirancang dengan arah visual **modern, hangat, dan trustworthy** — cocok untuk UMKM Indonesia. Bukan korporat dingin, bukan pula terlalu playful.

| Aspek | Pilihan |
|-------|---------|
| **Tone** | Profesional hangat, approachable |
| **Karakter** | Bersih, lapang, ngga sumpek |
| **Siapa lawan bicara?** | Pemilik UMKM yang ingin monitor bisnis cepat |

### Color Palette

```css
/* Primary — teal, tenang, dipercaya */
--color-teal-50:  #ecfdf5;
--color-teal-100: #d1fae5;
--color-teal-200: #a7f3d0;
--color-teal-300: #6ee7b7;
--color-teal-400: #34d399;
--color-teal-500: #10b981;
--color-teal-600: #059669;
--color-teal-700: #047857;
--color-teal-800: #055f4e;
--color-teal-900: #064e3b;

/* Accent — amber hangat, energetic */
--color-amber-50:  #fffbeb;
--color-amber-100: #fef3c7;
--color-amber-200: #fde68a;
--color-amber-300: #fcd34d;
--color-amber-400: #fbbf24;
--color-amber-500: #f59e0b;
--color-amber-600: #d97706;
--color-amber-700: #b45309;
--color-amber-800: #92400e;
--color-amber-900: #78350f;

/* Surface — warm neutral */
--color-surface:    #fafaf9;   /* background utama */
--color-surface-50: #f5f5f4;   /* card bg alternatif */
--color-border:     #e7e5e4;   /* border halus */
--color-text:       #1c1917;   /* text utama (stone-900) */
--color-text-muted: #78716c;   /* text sekunder (stone-500) */
```

**Prinsip warna:**
- Teal sebagai identitas utama (sidebar, button, status connected)
- Amber hanya sebagai aksen selektif (badge, highlight, icon)
- Surface warm neutral, bukan putih murni (#fafaf9 bukan #ffffff)
- Text pakai warm tone (stone), bukan gray murni — lebih natural

### Typography

| Konteks | Font | Fallback |
|---------|------|----------|
| **Body** | system-ui, -apple-system, sans-serif | System stack |
| **Headline** | system-ui, -apple-system, sans-serif | Bold weight |
| **Angka/Data** | system-ui tabular-nums | Monospace spacing |
| **Kode** | ui-monospace, monospace | — |

> Tidak pakai font custom (Google Fonts dll) — biar loading cepet. System font stack sudah cukup kalau dipadukan dengan spacing dan weight yang intentional.

### Spacing & Rhythm

Menggunakan skala Tailwind default, tapi dipilih secara intentional:

```css
/* Rhythm vertikal antar section */
--section-gap: 2rem;       /* space-y-8 */
--card-padding: 1.5rem;    /* p-6 */
--card-gap: 1rem;          /* gap-4 */
--sidebar-width: 16rem;    /* w-64 */
--content-max-width: 80rem;/* max-w-7xl */
```

### Surface & Shadow

```css
/* Card */
--card-bg: white;
--card-border: 1px solid #e7e5e4;  /* subtle border */
--card-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
--card-radius: 0.75rem;             /* rounded-xl */

/* Sidebar */
--sidebar-bg: #055f4e;             /* teal-800 */
--sidebar-text: #ecfdf5;           /* teal-50 */
--sidebar-hover: rgba(255,255,255,0.08);

/* Interactive */
--button-primary: #059669;         /* teal-600 */
--button-primary-hover: #047857;   /* teal-700 */
--button-danger: #ef4444;
```

### Layout Approach

```
┌─────────────────────────────────────────────────────────┐
│ [SIDEBAR]                      │ [MAIN CONTENT]          │
│ teal-800, fixed w-64           │ bg-surface, flex-1      │
│                                │                         │
│  ┌─ Logo / Brand ──────────┐   │  ┌─ Topbar ──────────┐  │
│  │                         │   │  │ Breadcrumb + dot  │  │
│  └─────────────────────────┘   │  └───────────────────┘  │
│                                │                         │
│  ● Dashboard            ←active│  ┌─ Content ──────────┐ │
│  ○ Products                   │  │  Lega, breathing    │ │
│  ○ Orders                     │  │                     │ │
│  ○ Customers                  │  │  Cards dengan       │ │
│  ○ Settings                   │  │  accent border kiri │ │
│                                │  └─────────────────────┘ │
│                                │                         │
│  ┌── Connection ────────────┐  │                         │
│  │ 🟢 Connected             │  │                         │
│  ├──────────────────────────┤  │                         │
│  │ [W] WANI Kitchen         │  │                         │
│  │     Store Owner          │  │                         │
│  └──────────────────────────┘  │                         │
└─────────────────────────────────────────────────────────┘
```

**Prinsip layout:**
- Sidebar gelap (teal-800) — bikin kontras bersih dengan konten
- Content area lapang — whitespace adalah fitur, bukan bug
- Tiap section punya breathing room (min 2rem antar section)
- Card diberi accent border kiri (4px teal) untuk hierarki visual

### Motion

Hanya 2-3 momen intentional, bukan animasi sembarangan:

1. **Loading skeleton** — shimmer halus saat data belum ada
2. **Status transition** — WA connected/disconnected, background card berubah smooth (500ms)
3. **Hover** — sidebar item: subtle bg shift + left border muncul

### Anti-Patterns (yang DIHINDARI)

- ❌ Gradient biru-putih korporat
- ❌ Shadow tebal / blur berlebihan
- ❌ Card yang semuanya sama tanpa hierarki
- ❌ Animasi random di tiap element
- ❌ Font Google yang nambah load time
- ❌ Icon macem-macem tanpa sistem
- ❌ Tabel yang sumpek tanpa breathing room

---

## Directory Structure

```
dashboard/
├── index.html                   # HTML entry
├── vite.config.ts               # Vite config (Tailwind + React Compiler + API proxy)
├── tsconfig.json                # Root TS config (project references)
├── tsconfig.app.json            # TS config for src/
├── tsconfig.node.json           # TS config for vite.config.ts
├── eslint.config.js             # ESLint flat config
├── package.json
├── bun.lock
│
├── ARCHITECTURE.md              # ← This file
├── API_SPEC.md                  # API contract specification
│
├── public/                      # Static assets (favicon, etc.)
│
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Router setup (createBrowserRouter)
│   ├── index.css                # @import "tailwindcss"
│   │
│   ├── assets/                  # Images, SVGs
│   │
│   ├── lib/                     # Core utilities
│   │   └── api.ts               # Fetch wrapper (unified response parse)
│   │
│   ├── hooks/                   # Custom React hooks (mock-based, MOCK toggle)
│   │   ├── useWaStatus.ts       # WA connection status + QR polling
│   │   ├── useProducts.ts       # Produk CRUD + sort/filter
│   │   ├── useOrders.ts         # Order list + sort/filter/status
│   │   ├── useCustomers.ts      # Customer list + conversations
│   │   └── useSettings.ts       # Store profile + AI config
│   │
│   ├── components/              # Shared UI components & feature components
│   │   ├── ui/                  # Primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── Layout.tsx           # Shell: sidebar + topbar + main + bottom nav
│   │   ├── Sidebar.tsx          # Desktop navigation + WA status + store owner
│   │   ├── Topbar.tsx           # Header breadcrumb + connection indicator
│   │   ├── BottomNav.tsx        # Mobile bottom tab navigation
│   │   ├── Icons.tsx            # SVG icon library
│   │   ├── QRCode.tsx           # QR display from string
│   │   ├── StatusCard.tsx       # Metric stat card
│   │   ├── StoreTab.tsx         # Settings — Store tab form
│   │   ├── AiTab.tsx            # Settings — AI Agent tab form
│   │   ├── WaSessionTab.tsx     # WA QR login + session detail (uses useWaStatus)
│   │   ├── ProductListView.tsx  # Products — sortable table view
│   │   ├── ProductCard.tsx      # Products — card/grid view
│   │   ├── OrderListView.tsx    # Orders — sortable table view
│   │   ├── OrderTimeline.tsx    # Orders — status timeline
│   │   ├── CustomerListView.tsx # Customers — list panel
│   │   └── ChatView.tsx         # Customers — inline chat panel
│   │
│   ├── pages/                   # Page components (one per route)
│   │   ├── Dashboard.tsx        # Revenue, pending orders, stock alerts, WA status
│   │   ├── Products.tsx         # Product list/card + CRUD form
│   │   ├── ProductForm.tsx      # Add/Edit product form
│   │   ├── Orders.tsx           # Order list with sort & status filter
│   │   ├── OrderDetail.tsx      # Order detail + status timeline
│   │   ├── Customers.tsx        # Dual-panel: customer list + inline chat
│   │   └── Settings.tsx         # Tabs: Store / AI Agent / WA Session
│   │
│   └── (no mocks/ — inline mock data in each hook)
```

---

## Component Architecture

### Design System

Semua UI primitives ada di `components/ui/`, menggunakan Tailwind utility classes — tidak ada component library eksternal.

```
┌─────────────────────────────────────────────────────────┐
│  <Layout>                                                │
│  ┌──────────┬──────────────────────────────────────────┐ │
│  │          │  <Topbar>                                 │ │
│  │          │  Home / Dashboard                         │ │
│  │ <Sidebar>├──────────────────────────────────────────┤ │
│  │          │                                           │ │
│  │  • Dashboard│  <main>                                │ │
│  │  • Products│    <Outlet />  ← halaman aktif          │ │
│  │  • Orders  │                                           │ │
│  │  • Customers│                                          │ │
│  │  • Settings│                                           │ │
│  │          │                                           │ │
│  │  ────────│                                           │ │
│  │  🟢 WA   │                                           │ │
│  │  [W] Store│                                           │ │
│  └──────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

<Layout>
  ├── <Sidebar>
  │     ├── NavItem (Dashboard)          → "/"
  │     ├── NavItem (Products)           → "/products"
  │     ├── NavItem (Orders)             → "/orders"
  │     ├── NavItem (Customers)          → "/customers"
  │     └── NavItem (Settings)           → "/settings"
  │
  ├── <Topbar>
  │     ├── Breadcrumbs
  │     └── ConnectionIndicator (dot hijau/merah)
  │
  └── <main>
        └── <Outlet />
```

---

## Routing Design

```
/                   → Dashboard (QR + Status + quick stats)
/products           → Products (CRUD table)
/products/new       → ProductForm (create)
/products/:id       → ProductForm (edit)
/orders             → Orders (list with filters)
/orders/:id         → OrderDetail
/customers          → Customers + Chats (list + inline chat)
/customers/:id      → Customers (state-driven, not a separate page)
/settings           → Store + AI Config + WA Session
```

React Router v8 dengan `createBrowserRouter`:

```tsx
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true,          element: <Dashboard /> },
      { path: 'products',     element: <Products /> },
      { path: 'products/new',  element: <ProductForm /> },
      { path: 'products/:id',  element: <ProductForm /> },
      { path: 'orders',       element: <Orders /> },
      { path: 'orders/:id',   element: <OrderDetail /> },
      { path: 'customers',    element: <Customers /> },
      { path: 'customers/:id',element: <Customers /> },
      { path: 'settings',     element: <Settings /> },
    ],
  },
])
```

---

## Data Flow

```
  ┌──────────────────────────────────────────────────┐
  │                   API Server                       │
  │              http://localhost:3001                  │
  └───────┬──────────────────────────┬────────────────┘
          │                          │
          │ GET /api/qr              │ GET /api/qr/status
          │ GET /api/products        │ GET /api/orders
          │ POST /api/products       │ PUT /api/orders/:id/status
          │ (dll)                    │ (dll)
          ▼                          ▼
  ┌──────────────────────────────────────────────┐
  │               Vite Proxy                       │
  │        /api/* → http://localhost:3001/*         │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │            src/lib/api.ts                     │
  │  fetchApi<T>(path) → Promise<ApiResponse<T>>   │
  │                                                │
  │  interface ApiResponse<T> {                   │
  │    status: 'success' | 'failure'              │
  │    message: string                            │
  │    data: T | null                             │
  │  }                                             │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │            src/hooks/use*.ts                   │
  │                                                │
  │  useWaStatus()      → { qr, connection, ... } │
  │  useProducts()       → { products, loading }  │
  │  useOrders()         → { orders, filters }    │
  │  useCustomers()      → { customers, chats }   │
  └──────────────────┬───────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────┐
  │            src/pages/*.tsx                     │
  │  (page components consume hooks,              │
  │   render UI via components/)                   │
  └──────────────────────────────────────────────┘
```

### Polling Strategy

| Page | Endpoint | Interval | Notes |
|------|----------|----------|-------|
| Dashboard | `/api/qr` + `/api/qr/status` | 5 detik | QR & status real-time |

Hanya WA status yang di-polling. Semua data bisnis (products, orders, customers, settings) saat ini **mock-only** — tidak ada fetching API. Rencana polling untuk halaman lain akan ditambahkan setelah integrasi API.

### Response Format (konsisten dari API)

```typescript
// Success
{ status: "success", message: string, data: T }

// Error
{ status: "failure", message: string, data: null | ZodIssue[] }

// Error classes
400 — BadRequestError    (validation failed)
401 — UnauthorizedError  (missing/invalid token)
403 — ForbiddenError
404 — NotFoundError
500 — InternalServerError
```

---

## Page Specifications

### 1. Dashboard (`/`)

```
┌─────────────────────────────────────────────────────┐
│  Dashboard                                           │
│  Ringkasan bisnis dan status penting                 │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │ 💰Revenue │  │ ⏳Perlu   │  │ 📦Produk  │  │ 👥    ││
│  │ Rp215.000│  │ Diproses │  │ Aktif    │  │ Cust  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  Pesanan Perlu Diproses           [Lihat Semua →] ││
│  │  #ORD-003  Budi Santoso            Pending    →  ││
│  │  #ORD-004  Siti Rahma              Confirmed  →  ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  ┌────────────────────┐  ┌────────────────────────┐  │
│  │ 📡 WhatsApp Status │  │ 📦 Perhatian Stok      │  │
│  │ 🟢 Connected       │  │ Tahu Crispy (Stok: 0)  │  │
│  │ +6281234567890     │  │ Jus Alpukat (Tdk aktif)│  │
│  └────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Data:** 4 metrik (revenue, pending orders, active products, customers) + pending orders list + stock alerts + WA status. Semua dari mock hooks.

### 2. Products (`/products`)

```
┌─────────────────────────────────────────────────────┐
│  Products                    [List/Card] [+ Add Product]
│                                                      │
│  ┌─ Search ──────────────────── [Category ▽] ──────┐│
│  ├──────┬──────────┬───────┬──────┬───────┬────────┤│
│  │ Name↑│ Category │ Price↑│ Stock│ Status│ Actions││
│  ├──────┼──────────┼───────┼──────┼───────┼────────┤│
│  │ [img]│ Nasi Goreg│ 25.000│  12  │ Active│ ✏️ 🗑️ ││
│  │ [img]│ Es Teh    │  5.000│  50  │ Active│ ✏️ 🗑️ ││
│  └──────┴──────────┴───────┴──────┴───────┴────────┘│
│                                                      │
│  Atau tampilan Card (grid, 20/page, paginated)      │
└─────────────────────────────────────────────────────┘
```

**Data:** All products. Sortable headers (Name, Category, Price, Stock, Status). Dual view: List (table, no pagination) / Card (grid, 20/page, paginated). Form di halaman terpisah (`/products/new`, `/products/:id`).

### 3. Orders (`/orders`)

```
┌─────────────────────────────────────────────────────┐
│  Orders                         [Status ▽]           │
│                                                      │
│  ┌─ Search ────────────────────────────────────────┐│
│  ├───────┬──────────┬───────┬────────┬──────┬──────┤│
│  │ Order↑│ Customer │ Items│ Total↑ │Status│Date↑ ││
│  ├───────┼──────────┼───────┼────────┼──────┼──────┤│
│  │ #001  │ Budi     │ 2     │ Rp45k  │ Pending│ 20/6││
│  │ #002  │ Ani      │ 1     │ Rp25k  │ Proses│ 20/6││
│  └───────┴──────────┴───────┴────────┴──────┴──────┘│
└─────────────────────────────────────────────────────┘
```

Default sort: PENDING → CONFIRMED → PROCESSING → COMPLETED → CANCELLED.
Semua header sortable. Klik row → `/orders/:id` (detail + status timeline + payment info).

### 4. Customers + Chats (`/customers`)

```
┌─────────────────────────────────────────────────────┐
│  Customers                     [Search...]           │
│                                                      │
│  ┌──────────────────┬──────────────────────────────┐│
│  │  Customer List    │  [Chat Area - jika dipilih]  ││
│  │                   │                              ││
│  │  🟢 Budi         │  Customer: Budi              ││
│  │    3 pesan baru   │  ─────────────────────      ││
│  │                   │  [10:30] Budi: Pesan...     ││
│  │  🟡 Siti         │  [10:30] AI: Baik kak...    ││
│  │    1 pesan baru   │  ┌─────────────────────┐   ││
│  │                   │  │ Ketik pesan... [➤] │   ││
│  │  ⚪ Ani           │  └─────────────────────┘   ││
│  │                   │                              ││
│  └──────────────────┴──────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

Layout: dua panel (desktop) / single column (mobile).
Kiri: daftar customer + status online + preview chat terakhir.
Kanan: chat panel penuh dengan input send message.
Klik customer → load percakapan.

### 5. Settings (`/settings`)

Settings adalah halaman tab tunggal dengan 3 bagian:

| Tab | Isi |
|-----|-----|
| **Store** | Business name, phone, logo/photo, address, business hours, payment methods, shipping info, return policy |
| **AI Agent** | System prompt, model, greeting message, knowledge base, temperature, max tokens, active toggle |
| **WA Session** | QR login flow, status koneksi (dot + label), nomor telepon, session detail (platform, connected since, last active), disconnect/connect button, info card tentang session |

Desain tab horizontal di bagian atas, konten di bawah. Satu form per tab.

**Data Flow WA Session:**
- Settings menggunakan `useWaStatus` (sama dengan Dashboard) sebagai sumber data — polling `GET /api/qr` + `GET /api/qr/status`
- Local state `override` di Settings.tsx untuk demo disconnect/connect flow: klik Disconnect → override ke `disconnected` (show QR placeholder); klik Connect → reset override, tampilkan data live dari `useWaStatus`
- `WaSessionTab` menerima `{ qr, connection, phone }` sebagai props individual (bukan `WaSession` object)
- Tiga tampilan: **Connected** (detail session card + 4 info fields) | **Disconnected** (QR placeholder + instruksi + tombol Connect) | **Connecting** (QR code + countdown + tombol Generate New QR)

> **Catatan**: `useSettings` tidak lagi mengelola state WA session — semua data WA berasal dari `useWaStatus`. `WaSession` interface telah dihapus dari `useSettings`.

---

## State Management

**Tidak pakai Redux/Zustand.** Cukup pake:

- **Custom hooks** — untuk data fetching & caching per halaman
- **URL state** — React Router search params untuk filter, sort, page
- **`useState` + `useEffect`** — untuk UI state lokal

Jika polling data dibutuhkan di multiple pages, hook akan di-memoize dengan `useCallback` + `useRef`.

### Kenapa?

- Dashboard ini halaman-by-halaman, tidak ada shared state kompleks antar halaman
- Setiap halaman fetch data sendiri dari API
- Kalaupun perlu shared state (misal: connection status di sidebar), cukup context sederhana

---

## Mock Strategy

### Inline Mock Data (Current)

Setiap hook memiliki konstanta `MOCK = true` dan data dummy inline:

```typescript
// hooks/useProducts.ts
const MOCK = true

const mockProducts: Product[] = [
  { id: 'prod-1', name: 'Nasi Goreng Spesial', price: 25000, ... },
  // ...
]

export function useProducts() {
  const allProducts = useMemo(() => MOCK ? mockProducts : [], [])
  // ...
}
```

**Mekanisme:**
- `MOCK = true` → return data inline (array/object di file yang sama)
- `MOCK = false` → return empty/initial state (siap diisi fetching API)
- Semua mutasi (create/update/delete) berjalan di memori lokal — tidak persist

Setiap hook punya toggle sendiri, sehingga bisa progresif switch ke API per fitur.

### Transisi ke API

Untuk mengaktifkan API sungguhan:
1. Set `MOCK = false` di hook terkait
2. Implementasi fetching via `fetchApi<T>()` dari `lib/api.ts`
3. Ganti operasi mutasi dengan POST/PUT/DELETE ke API server

---

## Development Workflow

```bash
# 1. Start dev server (HMR)
cd dashboard && bun run dev

# 2. Build & type-check
bun run build              # tsc -b && vite build

# 3. Lint
bun run lint

# 4. Preview production build
bun run preview
```

### Aturan

1. **Jangan turunin versi package** saat ada error. Cari solusi di dokumentasi/Stack Overflow/GitHub issues.
2. **Tanya dulu sebelum ngoding.** Semua perubahan besar lewat review di chat dulu.
3. **Commit tiap fitur selesai.** Bukan tiap hari.
4. **Mock first.** Develop UI dengan mock data dulu, baru konek ke API belakangan.

---

## Roadmap

| Phase | Target | Deliverable |
|-------|--------|-------------|
| **P1** | ✅ Selesai | Stack update + Layout shell + Dashboard page |
| **P2** | ✅ Selesai | Products CRUD (list, card, form, categories, sort) |
| **P3** | ✅ Selesai | Orders management (list, detail, status update, sort) |
| **P4** | ✅ Selesai | Customers + Inline Chat (dual panel, mobile back) |
| **P5** | ✅ Selesai | Settings (Store + AI + WA Session tabs with photo) |
| **P6** | ▶ Selanjutnya | Integrasi API — ganti mock dengan fetch ke backend |
