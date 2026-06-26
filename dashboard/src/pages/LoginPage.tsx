import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth.ts'
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '@/components/Icons.tsx'
import Button from '@/components/ui/Button.tsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, login, loading, error } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (error) {
      setShaking(true)
      const t = setTimeout(() => setShaking(false), 500)
      return () => clearTimeout(t)
    }
  }, [error])

  function validate() {
    const errors: { email?: string; password?: string } = {}
    if (!email) errors.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid'
    if (!password) errors.password = 'Password wajib diisi'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await login(email, password)
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${shaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-stone-900">Masuk</h2>
        <p className="mt-1 text-sm text-stone-500">Masuk ke dashboard WANI Anda</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Email atau password tidak cocok</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-500">Email</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              <MailIcon />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
              placeholder="admin@wani.id"
              className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:outline-none focus:ring-2 ${fieldErrors.email || error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-stone-300 focus:border-teal-500 focus:ring-teal-500/20'}`}
            />
          </div>
          {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-500">Password</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              <LockIcon />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
              placeholder="Masukkan password"
              className={`h-11 w-full rounded-lg border bg-white pl-10 pr-10 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:outline-none focus:ring-2 ${fieldErrors.password || error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-stone-300 focus:border-teal-500 focus:ring-teal-500/20'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
        </div>
      </div>

      <div className="text-right">
        <Link to="/forgot-password" className="text-sm font-medium text-teal-600 hover:text-teal-700">
          Lupa password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Masuk
      </Button>

      <p className="text-center text-sm text-stone-500">
        Belum punya akun?{' '}
        <Link to="/signup" className="font-medium text-teal-600 hover:text-teal-700">
          Daftar
        </Link>
      </p>
    </form>
  )
}
