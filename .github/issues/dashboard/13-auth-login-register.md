# DSH-13 — Next.js Auth: Login, Register & JWT Middleware

## Deskripsi
Implementasi authentication flow di Next.js: halaman login, register, JWT cookie management, middleware untuk proteksi route, dan hooks/auth context.

## Task Checklist

### 1. Auth Pages
#### Login (`/login`)
- [x] Form: input nomor WA, input password
- [x] Label & placeholder Bahasa Indonesia
- [x] Client-side validation dengan Zod
- [x] Submit → fetch `POST /api/auth/login` via Next.js API proxy
- [x] Save JWT ke httpOnly cookie (via Express Set-Cookie header)
- [x] Error state: "Nomor WA atau kata sandi salah"
- [x] Loading state: spinner di button
- [x] Redirect ke `/dashboard` setelah sukses
- [x] Link ke halaman register: "Belum punya akun? Daftar"

#### Register (`/register`)
- [x] Form: nama toko, nomor WA, password, konfirmasi password, alamat (optional)
- [x] Format nomor WA: validasi regex 62 prefix
- [x] Password match validation (Zod refine)
- [x] Submit → `POST /api/auth/register`
- [x] Auto login setelah register sukses (return JWT, set cookie)
- [x] Link ke halaman login: "Sudah punya akun? Masuk"

### 2. Auth Middleware (`src/middleware.ts`)
- [x] Check `token` cookie
- [x] Redirect unauthenticated users from `/dashboard/*` to `/login`
- [x] Redirect authenticated users from `/login`/`/register` to `/dashboard`
- [x] Config matcher: `/dashboard/:path*`, `/login`, `/register`

### 3. Auth Context & Hooks
- [x] `src/lib/auth-context.tsx` — React context with Merchant, isLoading, login, register, logout
- [x] `useAuth()` hook — full auth accessor
- [x] `useMerchant()` hook — return merchant data
- [x] Fetch merchant on mount via `GET /api/merchants/me`
- [x] Auto-redirect via react-router navigation

### 4. API Client
- [x] `src/lib/api.ts` — fetch wrapper with:
  - [x] Auto-attach cookies via `credentials: 'include'`
  - [x] Error response parsing
  - [x] Base URL: relative (`/api/...`) via Next.js proxy
  - [x] TypeScript generics untuk response type
  - [x] Added `patch` method

### 5. Logout
- [x] Clear cookie via `POST /api/auth/logout`
- [x] Redirect ke `/login`

### 6. Backend Auth Changes
- [x] Add `passwordHash` field to Merchant model (Prisma schema + db push)
- [x] Install `bcryptjs` for password hashing
- [x] Update `POST /api/auth/register` — hash password, set cookie
- [x] Update `POST /api/auth/login` — verify password, set cookie
- [x] Add `POST /api/auth/logout` — clear cookie
- [x] Strip `passwordHash` from register response
- [x] Update `.env` with correct DB credentials
- [x] Update seed with demo merchant password (`password123`)

## Verification
- [x] Buka `/dashboard` tanpa login → redirect ke `/login` (via middleware)
- [x] Register dengan data valid → masuk dashboard (tested via curl)
- [x] Login dengan data benar → masuk dashboard (tested via curl)
- [x] Login dengan data salah → error message
- [x] Logout → redirect ke `/login`
- [x] Cookie ter-set dengan benar (via Express Set-Cookie)

## Labels
`frontend`, `dashboard`, `auth`, 🔴 high

## Dependencies
FND-04, API-06 (merchants/me endpoint)

## Estimasi
1-2 hari
