# Email System — Tahap 3

> Implementasi SMTP untuk forgot password dan notifikasi

---

## Current State

- `POST /api/auth/forgot-password` mengembalikan reset token di HTTP response (BUG-001)
- Tidak ada email transport sama sekali
- Token disimpan di database (`resetPasswordToken` + `resetPasswordExpires`) tapi tidak pernah dikirim

## Target State

1. User masukkan email → token dikirim via email
2. Token valid 1 jam
3. Link reset password: `https://dashboard.wani.app/reset-password?token=xxx`
4. Password berhasil direset

---

## 1. SMTP Configuration

### Environment Variables

```env
# api/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@wani.app
SMTP_PASSWORD=app-password-here
SMTP_FROM="WANI <noreply@wani.app>"
APP_URL=https://dashboard.wani.app
```

### Email Service

```typescript
// api/src/services/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  })
}
```

---

## 2. Password Reset Flow (Revised)

### POST /api/auth/forgot-password — Revised

```typescript
// api/src/controllers/auth.ts — revised forgotPassword
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body

  const user = await UserModel.findByEmail(email)
  if (!user) {
    // Don't reveal whether email exists
    return sendResponse(res, 200, 'Jika email terdaftar, link reset telah dikirim')
  }

  // Generate token
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600_000) // 1 jam

  await UserModel.update(user.id, {
    resetPasswordToken: token,
    resetPasswordExpires: expires,
  })

  // Send email
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`
  await sendEmail({
    to: email,
    subject: 'Reset Password — WANI',
    html: `
      <h1>Reset Password WANI</h1>
      <p>Anda meminta reset password untuk akun WANI.</p>
      <p>Klik link berikut untuk reset password (berlaku 1 jam):</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
    `,
  })

  // ❌ JANGAN return token!
  return sendResponse(res, 200, 'Jika email terdaftar, link reset telah dikirim')
}
```

### POST /api/auth/reset-password

```typescript
export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body

  const user = await UserModel.findByResetToken(token)
  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new BadRequestError('Token reset tidak valid atau sudah kadaluarsa')
  }

  // Validate password complexity
  const parsed = resetPasswordSchema.safeParse({ password: newPassword })
  if (!parsed.success) {
    throw new BadRequestError('Password tidak memenuhi syarat keamanan')
  }

  const hashedPassword = await hashPassword(newPassword)
  await UserModel.update(user.id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  })

  return sendResponse(res, 200, 'Password berhasil direset')
}
```

---

## 3. Dashboard: Reset Password Page

### Route Baru

```typescript
// dashboard/src/App.tsx — tambah route
{
  path: '/reset-password',
  element: <ResetPasswordPage />
}
```

### Halaman Baru

```typescript
// dashboard/src/pages/ResetPasswordPage.tsx
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) {
      setError('Token reset tidak ditemukan')
      setStatus('error')
      return
    }

    setStatus('loading')
    try {
      await fetchApi('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      })
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal reset password')
      setStatus('error')
    }
  }

  if (!token) {
    return <div>Token reset tidak valid. Silakan minta link reset baru.</div>
  }

  return (
    <AuthLayout>
      {status === 'success' ? (
        <div>Password berhasil direset! Silakan login.</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Password input + validation */}
        </form>
      )}
    </AuthLayout>
  )
}
```

---

## 4. Optional: Templated Emails

Untuk email yang lebih bagus, gunakan template engine:

```typescript
// api/src/services/email-templates.ts
export function resetPasswordTemplate(resetUrl: string, userName: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
      <div style="background: linear-gradient(135deg, #0d9488, #f59e0b); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">WANI</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p>Halo ${userName},</p>
        <p>Anda meminta reset password untuk akun WANI Anda.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px;">Link berlaku 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    </div>
  `
}
```

---

## Checklist

- [ ] SMTP configuration via environment variables
- [ ] Email service abstraction (`services/email.ts`)
- [ ] Forgot password flow revised (no token leak)
- [ ] Reset password page di dashboard
- [ ] Email template yang branded
- [ ] Unit tests untuk email service (mock nodemailer)
- [ ] Integration test untuk forgot password flow
- [ ] Rate limiting untuk forgot password endpoint (anti-abuse)
