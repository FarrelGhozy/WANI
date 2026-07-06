# Security Fixes — Tahap 1

> Semua perbaikan keamanan yang harus dilakukan

---

## 1. CRITICAL: Password Reset Token Leak

**Bug:** BUG-001
**File:** `api/src/controllers/auth.ts:108`
**Severity:** CRITICAL

### Masalah
Endpoint `POST /api/auth/forgot-password` mengembalikan reset token di HTTP response body. Ini memungkinkan attacker mendapatkan token tanpa akses email.

```typescript
// ❌ Current — token returned in response
res.status(200).json({
  status: "success",
  message: "If the email exists, a reset link has been sent",
  data: { resetToken: user.resetPasswordToken }  // LEAK!
})
```

### Fix
1. Hapus token dari response body
2. Implementasi email sending (SMTP / SendGrid / Resend)
3. Atau minimal: log token ke console untuk development

```typescript
// ✅ Fixed — token never leaves server
res.status(200).json({
  status: "success",
  message: "If the email exists, a reset link has been sent",
  data: null
})
```

---

## 2. CRITICAL: Leaked Credentials in Git

**Bug:** BUG-008
**File:** `wa-bot/.env`
**Severity:** CRITICAL

### Masalah
File `.env` di `wa-bot/` mengandung database credentials dan API token real, dan terlanjur di-commit ke git history.

### Fix
1. **ROTATE** semua credentials yang ter-expose:
   - Database password
   - API_TOKEN
2. Hapus `.env` dari git tracking:
   ```bash
   git rm --cached wa-bot/.env
   ```
3. Verifikasi `.gitignore` sudah include `.env`
4. Jika file sudah di-push ke remote, rotate credentials di production juga
5. Scan git history untuk credentials lain:
   ```bash
   git log --all --full-history -- wa-bot/.env
   # atau
   git grep -E '(API_TOKEN|DATABASE_PASSWORD|JWT_SECRET)' $(git rev-list --all)
   ```

---

## 3. HIGH: Hardcoded JWT Secret Fallback

**Bug:** BUG-011
**File:** `api/src/middleware/jwt.ts:5`
**Severity:** HIGH

### Masalah
JWT secret fallback ke string hardcoded `"wani-dev-secret-change-in-production"` jika `JWT_SECRET` env var tidak diset.

### Fix
```typescript
// ✅ Throw error if JWT_SECRET is not set
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
```

---

## 4. MEDIUM: No Password Complexity Rules

**File:** `api/src/controllers/auth.ts`
**Severity:** MEDIUM

### Masalah
Password validation hanya cek `password.length < 8`. Tidak ada aturan kompleksitas.

### Fix
Tambahkan Zod schema dengan:
- Min 8 karakter
- Min 1 uppercase
- Min 1 lowercase
- Min 1 angka
- Opsional: min 1 special character

```typescript
export const registerSchema = z.object({
  password: z.string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[0-9]/, "Password harus mengandung angka"),
})
```

---

## 5. MEDIUM: HTML Unescaped in Template Engine

**Bug:** BUG-012
**File:** `web-gen/src/generator.ts`
**Severity:** MEDIUM

### Masalah
Template engine tidak meng-escape HTML entities saat rendering variable. Product name seperti `<script>alert('xss')</script>` akan di-inject langsung ke HTML output.

### Fix
Tambahkan HTML escape function:
```typescript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

---

## Security Checklist (sebelum lanjut ke Tahap 2)

- [ ] Tidak ada hardcoded secrets di source code
- [ ] Semua credential yang ter-expose sudah di-rotate
- [ ] JWT_SECRET wajib diset (tidak ada fallback)
- [ ] Password complexity rules enforced
- [ ] HTML escaping di template engine
- [ ] Semua `.env` di `.gitignore` dan tidak di-tracking
- [ ] CSP headers production-ready
- [ ] Rate limiting enabled untuk semua endpoint publik
- [ ] Error messages tidak leak internal details di production
