# BUG-011: JWT Secret Hardcoded Fallback

| Field | Value |
|-------|-------|
| **ID** | BUG-011 |
| **Severity** | 🟢 MEDIUM |
| **Modul** | api |
| **File** | `api/src/middleware/jwt.ts:5` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

JWT secret fallback ke string hardcoded `"wani-dev-secret-change-in-production"` jika `JWT_SECRET` environment variable tidak diset. Ini berarti:
1. Default secret mudah ditebak
2. Jika developer lupa set JWT_SECRET di production, semua token bisa di-forge
3. Nama fallback-nya sendiri mengakui ini masalah (`"change-in-production"`)

## Kode Bermasalah

```typescript
// api/src/middleware/jwt.ts
import jwt from 'jsonwebtoken'

// ❌ Hardcoded fallback yang mudah ditebak
const JWT_SECRET = process.env.JWT_SECRET || 'wani-dev-secret-change-in-production'
//                                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                             Fallback yang tidak aman!

export function requireJwt(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) throw new UnauthorizedError('Token tidak ditemukan')

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded as { id: string; email: string; role: string }
    next()
  } catch {
    throw new UnauthorizedError('Token tidak valid')
  }
}
```

## Dampak

1. **JWT forgery** — attacker bisa buat token valid dengan secret default
2. **Authentication bypass** — akses endpoint JWT-protected tanpa login
3. **Production vulnerability** — jika lupa set env var di production

## Cara Reproduksi

```bash
# 1. Attacker tahu default secret
SECRET="wani-dev-secret-change-in-production"

# 2. Buat JWT token dengan secret default
TOKEN=$(node -e "
  const jwt = require('jsonwebtoken');
  console.log(jwt.sign({id:'fake',email:'attacker@evil.com',role:'admin'}, '$SECRET'));
")

# 3. Akses endpoint protected dengan token forged
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/store
# Response: Store data — authenticated!
```

## Rekomendasi Fix

```typescript
// ✅ Throw error jika JWT_SECRET tidak diset
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. ' +
    'Generate a secure secret: openssl rand -hex 32'
  )
}

// Atau — untuk development, generate random secret otomatis
const JWT_SECRET = process.env.JWT_SECRET
  ?? (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('JWT_SECRET is required in production') })()
    : require('crypto').randomBytes(32).toString('hex'))
```

### Startup Validation

```typescript
// api/src/config/env.ts — tambah validasi
if (process.env.JWT_SECRET === 'wani-dev-secret-change-in-production') {
  throw new Error(
    'JWT_SECRET is still using the default insecure value! ' +
    'Please set a secure JWT_SECRET in your .env file.'
  )
}
```
