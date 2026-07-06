# BUG-003: ForgotPassword Pakai Mock `setTimeout` — Bukan API Call

| Field | Value |
|-------|-------|
| **ID** | BUG-003 |
| **Severity** | 🟡 HIGH |
| **Modul** | dashboard |
| **File** | `dashboard/src/pages/ForgotPasswordPage.tsx:28` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Halaman ForgotPassword di dashboard menggunakan `setTimeout` 1.5 detik untuk mensimulasikan API call, bukan benar-benar memanggil `POST /api/auth/forgot-password`. Fitur forgot password tidak berfungsi dari dashboard.

## Kode Bermasalah

```typescript
// dashboard/src/pages/ForgotPasswordPage.tsx
async function handleSubmit(e: FormEvent) {
  e.preventDefault()
  setLoading(true)

  try {
    // ❌ BUG: Mock — tidak ada API call yang sebenarnya!
    await new Promise((r) => setTimeout(r, 1500))
    setSubmitted(true)
  } catch {
    setError('Gagal mengirim email')
  } finally {
    setLoading(false)
  }
}
```

## Dampak

1. **Fitur forgot password tidak berfungsi** — user tidak bisa reset password dari UI
2. User melihat pesan sukses tapi tidak ada email yang dikirim
3. Backend endpoint `POST /api/auth/forgot-password` TIDAK PERNAH dipanggil

## Cara Reproduksi

1. Buka dashboard → Login → "Lupa password?"
2. Masukkan email → klik "Kirim Link Reset"
3. **Actual:** Loading 1.5 detik → pesan sukses. Tapi tidak ada yang terjadi di backend.
4. **Expected:** API call → email terkirim → pesan sukses.

## Rekomendasi Fix

```typescript
async function handleSubmit(e: FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    // ✅ Panggil API beneran
    await fetchApi('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    setSubmitted(true)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Gagal mengirim email')
  } finally {
    setLoading(false)
  }
}
```

## Catatan

Halaman reset password (`/reset-password?token=xxx`) juga belum ada di dashboard. Perlu dibuat bersamaan dengan fix ini.

## Related
- [[BUG-001]] — Backend forgot password leak token di response
- [[Tahap 3 - Email System]](../tahap3-fitur/01-email-system.md) — Implementasi SMTP
