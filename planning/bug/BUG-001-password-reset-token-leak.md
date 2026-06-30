# BUG-001: Password Reset Token Dikembalikan di HTTP Response

| Field | Value |
|-------|-------|
| **ID** | BUG-001 |
| **Severity** | 🔴 CRITICAL |
| **Modul** | api |
| **File** | `api/src/controllers/auth.ts:108` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Endpoint `POST /api/auth/forgot-password` mengembalikan `resetPasswordToken` di HTTP response body. Token ini bisa digunakan siapa pun yang bisa membaca response untuk mereset password user tanpa akses email.

## Kode Bermasalah

```typescript
// api/src/controllers/auth.ts — forgotPassword handler
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body

  const user = await UserModel.findByEmail(email)
  if (!user) {
    return sendResponse(res, 404, 'Email tidak ditemukan')
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600_000)

  await UserModel.update(user.id, {
    resetPasswordToken: token,
    resetPasswordExpires: expires,
  })

  // ❌ BUG: Token dikembalikan di response!
  return sendResponse(res, 200, 'Link reset password', {
    resetToken: token,  // <- INI YANG SALAH
  })
}
```

## Dampak

1. **Account takeover** — Attacker bisa reset password user mana pun tanpa akses email
2. **No audit trail** — Tidak ada cara melacak siapa yang menggunakan token
3. **Violates security best practice** — Token reset harusnya hanya dikirim via email

## Cara Reproduksi

```bash
# 1. Daftar user
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Target","email":"target@example.com","password":"Password123"}'

# 2. Request forgot password — token muncul di response!
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"target@example.com"}'

# Response:
# {"status":"success","message":"Link reset password","data":{"resetToken":"abc123..."}}
#                                                         ^^^^^^^^^^^^^^^^^^^^^^^
# Attacker sekarang bisa reset password dengan token ini!

# 3. Reset password dengan token yang didapat dari response
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d '{"token":"abc123...","newPassword":"Hacked123"}'
```

## Rekomendasi Fix

```typescript
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body

  const user = await UserModel.findByEmail(email)

  // ⚠️ Jangan reveal apakah email terdaftar
  if (!user) {
    return sendResponse(res, 200, 'Jika email terdaftar, link reset telah dikirim')
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600_000)

  await UserModel.update(user.id, {
    resetPasswordToken: token,
    resetPasswordExpires: expires,
  })

  // ✅ KIRIM TOKEN VIA EMAIL — tidak di response body
  await sendEmail({
    to: email,
    subject: 'Reset Password WANI',
    html: `Klik link: ${APP_URL}/reset-password?token=${token}`,
  })

  // ✅ Response tidak mengandung token
  return sendResponse(res, 200, 'Jika email terdaftar, link reset telah dikirim')
}
```

## Related
- [[BUG-003]] — ForgotPassword mock di dashboard (belum ada UI reset password)
- [[Tahap 3 - Email System]](../tahap3-fitur/01-email-system.md) — Implementasi SMTP
