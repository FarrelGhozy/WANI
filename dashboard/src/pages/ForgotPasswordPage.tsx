import { useState } from 'react'
import { Link } from 'react-router'
import { MailIcon } from '@/components/Icons.tsx'
import Button from '@/components/ui/Button.tsx'
import Input from '@/components/ui/Input.tsx'
import { fetchApi } from '@/lib/api.ts'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError(undefined)
    if (!email) {
      setFieldError('Email wajib diisi')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('Format email tidak valid')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await fetchApi('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim email')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-600">
            <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-stone-900">Cek Email Anda</h2>
        <p className="text-sm text-stone-500">
          Jika akun dengan email <span className="font-medium text-stone-700">{email}</span> terdaftar,
          kami akan mengirimkan tautan reset password.
        </p>
        <Link
          to="/app/login"
          className="inline-block text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          Kembali ke Login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-stone-900">Lupa Password</h2>
        <p className="mt-1 text-sm text-stone-500">
          Masukkan email Anda dan kami akan kirim tautan reset.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setFieldError(undefined) }}
        placeholder="email@contoh.com"
        prefix={<MailIcon />}
        error={fieldError}
        inputSize="lg"
      />

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Kirim Tautan Reset
      </Button>

      <p className="text-center text-sm text-stone-500">
        <Link to="/app/login" className="font-medium text-teal-600 hover:text-teal-700">
          Kembali ke Login
        </Link>
      </p>
    </form>
  )
}
