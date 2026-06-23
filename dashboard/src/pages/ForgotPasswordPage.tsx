import { useState } from 'react'
import { Link } from 'react-router'
import { MailIcon } from '../components/Icons.tsx'
import Button from '../components/ui/Button.tsx'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      setError('Email wajib diisi')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email tidak valid')
      return
    }
    setLoading(true)
    setError(null)
    // Mock: simulate API call
    await new Promise((r) => setTimeout(r, 1500))
    setLoading(false)
    setSubmitted(true)
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
          to="/login"
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

      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-stone-500">Email</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <MailIcon />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            className="h-11 w-full rounded-lg border border-stone-300 bg-white pl-10 pr-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Kirim Tautan Reset
      </Button>

      <p className="text-center text-sm text-stone-500">
        <Link to="/login" className="font-medium text-teal-600 hover:text-teal-700">
          Kembali ke Login
        </Link>
      </p>
    </form>
  )
}
