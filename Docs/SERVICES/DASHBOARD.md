# Service: Dashboard (`dashboard/`)

React 19 + TypeScript 6 + Vite 8 (bundler **Rolldown**) + Tailwind v4. Berisi dashboard admin di `/app/*` dan **landing page publik** di `/` yang di-import langsung dari paket `landingpage/`.

---

## 1. Menjalankan

```bash
cd dashboard
cp .env.example .env          # VITE_API_URL=http://localhost:3001/api
bun install
bun run dev                   # http://localhost:5173
```

| Script | Perintah |
|--------|----------|
| `bun run dev` | `vite` (dev server, `server.host: true`) |
| `bun run build` | `tsc -b` (project references) lalu `vite build` |
| `bun run lint` | `eslint .` (flat config) |
| `bun run test` | `vitest run` |
| `bun run test:watch` | `vitest` |
| `bun run preview` | `vite preview` |

⚠️ **Vite dev server tidak mem-proxy `/api`.** Tanpa `VITE_API_URL` yang menunjuk `http://localhost:3001/api`, semua request akan kena 404 dari dev server. Di Docker, nginx yang mem-proxy `/api`, `/uploads`, `/s` ke service `api:3001`.

---

## 2. Routing (`src/App.tsx`)

`createBrowserRouter` (dari `react-router` v8) dengan struktur:

| Path | Halaman | Guard |
|------|---------|-------|
| `/` | `LandingPage` (dari `@landingpage/app/App.tsx`) | publik |
| `/app/login` | `LoginPage` | `AuthLayout` |
| `/app/signup` | `SignUpPage` | `AuthLayout` |
| `/app/forgot-password` | `ForgotPasswordPage` | `AuthLayout` |
| `/app/verify-email` | `VerifyEmailPage` | `AuthLayout` |
| `/app/reset-password` | `ResetPasswordPage` | `AuthLayout` |
| `/app` | `Dashboard` | `ProtectedRoute` + `WaStatusProvider` + `Layout` |
| `/app/products` | `Products` | idem |
| `/app/products/new` · `/app/products/:id` | `ProductForm` | idem |
| `/app/orders` · `/app/orders/:id` | `Orders` · `OrderDetail` | idem |
| `/app/customers` · `/app/customers/:id` | `Customers` (dual-panel) | idem |
| `/app/website` | `Website` | idem |
| `/app/settings` | `Settings` | idem |
| `*` | `NotFoundPage` | publik |

Root aplikasi dibungkus `ErrorBoundary`. `ProtectedRoute` menampilkan `Spinner` selama `useAuth()` memuat dan redirect ke `/app/login` bila tidak ada token.

### Provider bertingkat

```
ErrorBoundary
└── RouterProvider
    └── (route /app) ProtectedRoute
        └── WaStatusProvider            ← polling status QR/WA
            └── Layout
                ├── TourProvider        ← onboarding tour
                │   └── StoreProvider   ← profil toko global
                │       └── ProductsProvider
                │           ├── LayoutInner (Sidebar, Topbar, Outlet, BottomNav, Toast)
                │           └── TourOverlay
```

---

## 3. Halaman

| Halaman | Isi |
|---------|-----|
| `LoginPage`, `SignUpPage` | Form auth; login menyimpan token ke `localStorage`; signup mengarahkan ke verifikasi email |
| `ForgotPasswordPage`, `ResetPasswordPage`, `VerifyEmailPage` | Alur email (token dari query string) |
| `Dashboard` | Kartu statistik (`/api/dashboard/stats`), status WA, order terbaru, produk populer |
| `Products` (+ `ProductForm`) | List/grid produk, pencarian, filter kategori, CRUD, upload gambar |
| `Orders` (+ `OrderDetail`) | List dengan filter status/tanggal, timeline status, update status/notes/payment |
| `Customers` | Panel ganda: daftar pelanggan + `ChatView` (riwayat pesan, kirim pesan HUMAN, ubah status percakapan) |
| `Website` | Editor konfigurasi (hero, about, warna, sosial, pilih produk), pilih template, generate, preview, download ZIP, riwayat generation |
| `Settings` | **3 tab**: `Toko`, `AI Agent`, `WA Session` |
| `NotFoundPage` | 404 + navigasi kembali |

### Tab Settings

| Tab | Komponen | Isi |
|-----|----------|-----|
| `store` | `StoreTab` (+ `PaymentTab` + `CategoryModal`) | Profil toko, logo, jam buka, pengiriman, retur, kategori, **metode pembayaran** |
| `ai` | `AiTab` | Model, system prompt, knowledge base, temperature/maxTokens, greeting, status aktif |
| `wa` | `WaSessionTab` | QR / pairing code, status koneksi, tombol reset sesi |

Metode pembayaran **bukan** tab tersendiri: dikelola di dalam tab Toko memakai `usePaymentMethods()`.

---

## 4. Hook

Semua hook data memakai `fetchApi()` asli (tidak ada mock):

`useAuth`, `useProducts`, `useOrders`, `useCustomers`, `useSettings`, `usePaymentMethods`, `useWebsite`, `useWaStatus`, `useToast`, `useUnsavedChanges`.

Semuanya benar-benar memanggil API — tidak ada toggle mock yang tersisa di kode saat ini.

---

## 5. Klien HTTP (`src/lib/api.ts`)

```ts
const API_BASE = import.meta.env.VITE_API_URL || window.__ENV__?.API_URL || "/api";
```

- Token JWT dibaca dari `localStorage.wani_auth_token` dan dikirim sebagai `Authorization: Bearer …`.
- Respons `{ status, message, data }`; bila `status === "failure"` → `throw new Error(message)` (ditangkap UI sebagai pesan error).
- Helper lain: `lib/upload.ts` (upload multipart dengan field `file` + `prefix`), `lib/media.ts` (resolusi URL gambar: absolut, `/uploads/...`, atau data URL).
- Objek user disimpan di `localStorage.wani_auth_user`.

---

## 6. Komponen

**Layout & navigasi**: `Layout`, `Sidebar` (desktop, `lg:`), `Topbar`, `BottomNav` (mobile), `AuthLayout`, `ProtectedRoute`, `ErrorBoundary`, `TourOverlay` + `config/tourSteps.ts`.

**Fitur**: `StoreTab`, `AiTab`, `WaSessionTab`, `PaymentTab`, `CategoryModal`, `ProductListView`, `ProductCard`, `OrderListView`, `OrderTimeline`, `CustomerListView`, `ChatView`, `QRCode`, `StatusCard`, `ImageUpload`, `Icons`.

**Primitif UI** (`components/ui/`, tanpa library eksternal): `Button`, `Card`, `Badge`, `Table`, `Modal`, `Input`, `Select`, `Textarea`, `Spinner`, `Skeleton`, `EmptyState`, `Pagination`, `Toast` (+ `ToastContainer`), `ImageUpload`.

---

## 7. Styling

- **Tailwind v4 CSS-first** — tidak ada `tailwind.config.*`; konfigurasi lewat `@theme` di `src/index.css`.
- `index.css` mengimpor Google Fonts **Instrument Serif** + **Plus Jakarta Sans**, tetapi `@theme` menetapkan `--font-sans: 'Outfit', …` — **'Outfit' tidak diimpor**, sehingga teks biasanya jatuh ke `ui-sans-serif`/system font. Jika ingin konsisten, impor Outfit atau ubah tokennya.
- Palet: dasar `stone`, aksen `teal` (primer) dan `amber` (sekunder); border default `--color-stone-200`; body `bg-stone-50`.
- Animasi kustom: `@keyframes shake` (feedback form/error).
- Dependency yang **tidak terpakai** di `src/` saat ini: `gsap` dan `lucide-react` (terpasang, belum dipakai). QR di-render dengan `qrcode.react` (`QRCodeSVG`) di `components/QRCode.tsx`.

---

## 8. Testing

`vitest` (jsdom + `@testing-library/react`, setup di `src/test-setup.ts`, alias `@` → `src`) dengan file tes:

```
src/hooks/__tests__/useAuth.test.ts
src/hooks/__tests__/useCustomers.test.ts
src/hooks/__tests__/useOrders.test.ts
src/hooks/__tests__/useProducts.test.ts
src/hooks/__tests__/useSettings.test.ts
src/hooks/__tests__/useToast.test.ts
src/utils/__tests__/format.test.ts
```

`bun run build` menjalankan `tsc -b` lebih dulu sehingga error tipe menggagalkan build (Vite/Rolldown sendiri tidak melakukan type checking).

---

## 9. Catatan & Utang Teknis

- `src/pages/Dashboard.tsx` memiliki dua tombol yang menavigasi ke `/settings?tab=store` dan `/settings?tab=payment` **tanpa prefix `/app`** → akan berakhir di 404. Tombol lain sudah memakai `/app/...`. Ada juga navigasi ke `/app/settings?tab=payment`, padahal `payment` bukan id tab lagi (tab valid: `store`, `ai`, `wa`).
- `dashboard/default.conf` (nginx) melayani SPA dengan `try_files … /index.html` dan mem-proxy `/api/`, `/uploads/`, `/s/` ke `api:3001`; `docker-entrypoint.sh` menulis `/env.js` (`window.__ENV__.API_URL`) untuk konfigurasi runtime tanpa rebuild.
- `dashboard/tsconfig.json` hanya berisi project references ke `tsconfig.app.json` (kode aplikasi) dan `tsconfig.node.json` (config Vite).
- `erasableSyntaxOnly` aktif → jangan pakai `enum`/`namespace`/parameter property.
