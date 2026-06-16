# DSH-13 — Next.js Auth: Login, Register & JWT Middleware

## Deskripsi
Implementasi authentication flow di Next.js: halaman login, register, JWT cookie management, middleware untuk proteksi route, dan hooks/auth context.

## Task Checklist

### 1. Auth Pages
#### Login (`/login`)
- [ ] Form: input nomor WA, input password
- [ ] Label & placeholder Bahasa Indonesia
- [ ] Client-side validation dengan Zod:
  ```typescript
  const loginSchema = z.object({
    phone: z.string().min(10).max(15).regex(/^62\d+/),
    password: z.string().min(6),
  });
  ```
- [ ] Submit → fetch `POST /api/auth/login` via Next.js API route proxy
- [ ] Save JWT ke httpOnly cookie (pakai `next/headers` cookies())
- [ ] Error state: "Nomor WA atau password salah"
- [ ] Loading state: spinner di button
- [ ] Redirect ke `/dashboard` setelah sukses
- [ ] Link ke halaman register: "Belum punya akun? Daftar"

#### Register (`/register`)
- [ ] Form: nama toko, nomor WA, password, konfirmasi password, alamat (optional)
- [ ] Format nomor WA: otomatis tambah prefix 62, validasi panjang
- [ ] Password match validation
- [ ] Submit → `POST /api/auth/register`
- [ ] Auto login setelah register sukses (return JWT)
- [ ] Link ke halaman login: "Sudah punya akun? Masuk"

### 2. Auth Middleware (`src/middleware.ts`)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  // Redirect unauthenticated users to login
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

### 3. Auth Context & Hooks
- [ ] `src/lib/auth-context.tsx` — React context:
  ```typescript
  interface AuthContext {
    merchant: Merchant | null;
    isLoading: boolean;
    login: (phone: string, password: string) => Promise<void>;
    register: (data: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
  }
  ```
- [ ] `useAuth()` hook — convenient accessor
- [ ] `useMerchant()` hook — return merchant data (from context)
- [ ] Fetch merchant data on mount via `GET /api/merchants/me`
- [ ] Auto-refresh JWT sebelum expired

### 4. API Client
- [ ] `src/lib/api.ts` — fetch wrapper with:
  - [ ] Auto-attach JWT cookie
  - [ ] Error response parsing
  - [ ] Base URL: relative (`/api/...`) — via Next.js proxy
  - [ ] TypeScript generics untuk response type

### 5. Logout
- [ ] Clear cookie
- [ ] Redirect ke `/login`

### 6. Protected Route Handling
- [ ] Middleware redirect kalo ga ada token
- [ ] Kalo token expired → middleware redirect ke login
- [ ] Dashboard layout cek auth context → kalo null, render loading

## Verification
- [ ] Buka `/dashboard` tanpa login → redirect ke `/login`
- [ ] Register dengan data valid → masuk dashboard
- [ ] Login dengan data benar → masuk dashboard
- [ ] Login dengan data salah → error message
- [ ] Logout → redirect ke `/login`
- [ ] Cookie ter-set dengan benar

## Labels
`frontend`, `dashboard`, `auth`, 🔴 high

## Dependencies
FND-04

## Estimasi
1-2 hari
