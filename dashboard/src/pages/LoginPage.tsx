import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth.ts'
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '@/components/Icons.tsx'
import Button from '@/components/ui/Button.tsx'
import Input from '@/components/ui/Input.tsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, login, resendVerification, loading, error } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [shaking, setShaking] = useState(false)
  const [notVerified, setNotVerified] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    })
    return () => clearTimeout(t)
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
    setNotVerified(false)
    setResent(false)
    try {
      await login(email, password)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes('not verified')) setNotVerified(true)
    }
  }

  const handleResend = useCallback(async () => {
    try {
      await resendVerification(email)
      setResent(true)
    } catch {
      // error already set by resendVerification
    }
  }, [email, resendVerification])

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${shaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-stone-900">Masuk</h2>
        <p className="mt-1 text-sm text-stone-500">Masuk ke dashboard WANI Anda</p>
      </div>

      {error && !notVerified && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {notVerified && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">Email belum diverifikasi</p>
              <p className="mt-0.5 text-xs text-amber-700">
                {resent ? (
                  'Email verifikasi telah dikirim ulang! Silakan cek inbox Anda.'
                ) : (
                  <>Klik tombol di bawah untuk mengirim ulang email verifikasi ke <span className="font-medium">{email}</span>.</>
                )}
              </p>
              {!resent && (
                <button
                  onClick={handleResend}
                  className="mt-2 text-xs font-medium text-amber-800 underline underline-offset-2 transition-colors hover:text-amber-900"
                >
                  Kirim Ulang Verifikasi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
          placeholder="admin@wani.id"
          prefix={<MailIcon />}
          error={fieldErrors.email}
          inputSize="lg"
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
          placeholder="Masukkan password"
          prefix={<LockIcon />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
          error={fieldErrors.password}
          inputSize="lg"
        />
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
