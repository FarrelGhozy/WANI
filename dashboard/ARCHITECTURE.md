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
│   │   ├── api.ts               # Fetch wrapper (unified response parse)
│   │   └── cn.ts                # clsx + twMerge utility (future)
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useWaStatus.ts       # Polling WA connection status + QR
│   │   ├── useProducts.ts       # CRUD produk (future)
│   │   ├── useOrders.ts         # List + filter orders (future)
│   │   └── useCustomers.ts      # Customer list + chat history (future)
│   │
│   ├── components/              # Shared UI components
│   │   ├── ui/                  # Primitives (button, card, input, badge, table, modal, etc.)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── layout/              # Layout components
│   │   │   ├── Layout.tsx       # Shell: sidebar + topbar + main
│   │   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   │   ├── Topbar.tsx       # Header with breadcrumbs
│   │   │   └── PageHeader.tsx   # Title + actions bar
│   │   │
│   │   ├── qr/                  # WA connection related
│   │   │   ├── QRCode.tsx       # QR display from string
│   │   │   └── StatusCard.tsx   # Connection status badge
│   │   │
│   │   └── ... (feature-specific folders as needed)
│   │
│   ├── pages/                   # Page components (one per route)
│   │   ├── Dashboard.tsx        # Overview: QR + status + quick stats
│   │   ├── Products.tsx         # Daftar + CRUD produk (future)
│   │   ├── Orders.tsx           # Manajemen order (future)
│   │   ├── Customers.tsx        # Data pelanggan + riwayat chat (future)
│   │   └── Settings.tsx         # Profil toko + AI Config + WA Session (future)
│   │
│   └── mocks/                   # MSW mock handlers (future)
│       ├── browser.ts           # MSW browser worker setup
│       ├── handlers.ts          # All mock handlers
│       └── data/                # Mock data factories
│           ├── products.ts
│           ├── orders.ts
│           └── customers.ts
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
│  │  • QR    │  <main>                                   │ │
│  │  • Orders│    <Outlet />  ← halaman aktif            │ │
│  │  • Produk│                                           │ │
│  │  • Chat  │                                           │ │
│  │  • DLL   │                                           │ │
│  │          │                                           │ │
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
/customers/:id      → CustomerDetail + riwayat pesan
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
      { path: 'customers/:id',element: <CustomerDetail /> },
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
| Orders | `/api/orders` | 30 detik | Auto-refresh order baru |
| Customers | `/api/customers` + `/api/conversations` | 10 detik | Pesan baru dari WA (inline di customer detail) |

Non-polling pages (Products, Settings) pake **manual refresh** atau **optimistic update** setelah mutasi.

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
│  Overview                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ 📡 Connection │  │ 📞 Phone      │  │ 📦 Orders   ││
│  │ Connected     │  │ +62812...     │  │ 12 today    ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │              QR Code                              ││
│  │              [QR SVG]                             ││
│  │     Scan with WhatsApp > Linked Devices           ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Data:** QR string, connection status, phone number, quick stats (total orders hari ini, produk aktif, dll)

### 2. Products (`/products`)

```
┌─────────────────────────────────────────────────────┐
│  Products                          [+ Add Product]   │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Search...                            [Category ▽]││
│  ├──────┬──────────┬───────┬──────┬───────┬────────┤│
│  │ Image│ Name      │ Price │ Stock│ Status│ Actions││
│  ├──────┼──────────┼───────┼──────┼───────┼────────┤│
│  │ [img]│ Nasi Goreg│ 25.000│  12  │ Active│ ✏️ 🗑️ ││
│  │ [img]│ Es Teh    │  5.000│  50  │ Active│ ✏️ 🗑️ ││
│  └──────┴──────────┴───────┴──────┴───────┴────────┘│
└─────────────────────────────────────────────────────┘
```

**Data:** GET /api/products, POST/PUT/DELETE /api/products/:id

### 3. Orders (`/orders`)

```
┌─────────────────────────────────────────────────────┐
│  Orders                    [Status ▽] [Date range]   │
│                                                      │
│  ┌──────┬──────────┬──────────┬────────┬───────────┐│
│  │ Order│ Customer │ Items    │ Total  │ Status    ││
│  ├──────┼──────────┼──────────┼────────┼───────────┤│
│  │ #001 │ Budi     │ 2 items  │ Rp45k │ ✅ Selesai ││
│  │ #002 │ Ani      │ 1 item   │ Rp25k │ ⏳ Proses  ││
│  └──────┴──────────┴──────────┴────────┴───────────┘│
└─────────────────────────────────────────────────────┘
```

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
| **Store** | Business name, phone, address, business hours, payment methods, shipping info, return policy |
| **AI Agent** | System prompt, model, greeting message, knowledge base, temperature, max tokens, active toggle |
| **WA Session** | Status koneksi, nomor telepon, QR code (re-scan), disconnect button |

Desain tab horizontal di bagian atas, konten di bawah. Satu form per tab.

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

### Development tanpa Backend

Mode mock diaktifkan via konstanta di tiap hook:

```typescript
// hooks/useWaStatus.ts
const MOCK = true   // toggle: false = pakai API beneran

export function useWaStatus(): WaStatus {
  if (MOCK) {
    return {
      qr: 'sample-qr-data',
      connection: 'disconnected',
      phone: null,
      loading: false,
      error: null,
    }
  }
  // ... real API polling logic
}
```

### MSW (Mock Service Worker) — Rencana

Untuk development lebih advance, kita akan setup MSW:

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/qr', () =>
    HttpResponse.json({ status: 'success', message: 'ok', data: { qr: '...' } })
  ),
  http.get('/api/qr/status', () =>
    HttpResponse.json({ status: 'success', message: 'ok', data: { status: 'disconnected', phone: null } })
  ),
  // ... all endpoints
]
```

MSW jalan di browser (service worker), mencegat fetch dan return mock data. Tidak perlu backend sama sekali.

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
| **P1** | Sekarang | ✅ Stack update + Layout shell + Dashboard page |
| **P2** | Next | Products CRUD (list, form, categories) |
| **P3** | Next | Orders management (list, detail, status update) |
| **P4** | Next | Customers + Inline Chat (dual panel) |
| **P5** | Final | Settings (Store + AI + WA Session tabs) |
