import { useState, useCallback } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth.ts'
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, UserIcon } from '@/components/Icons.tsx'
import Button from '@/components/ui/Button.tsx'
import Input from '@/components/ui/Input.tsx'

export default function SignUpPage() {
  const { register, resendVerification, loading, error } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  function validate() {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Nama wajib diisi'
    if (!email) errors.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid'
    if (!password) errors.password = 'Password wajib diisi'
    else if (password.length < 8) errors.password = 'Minimal 8 karakter'
    if (!confirmPassword) errors.confirmPassword = 'Konfirmasi password wajib diisi'
    else if (password !== confirmPassword) errors.confirmPassword = 'Password tidak cocok'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const success = await register(name.trim(), email, password)
    if (success) setRegisteredEmail(email)
  }

  const handleResend = useCallback(async () => {
    if (!registeredEmail) return
    await resendVerification(registeredEmail)
    setResent(true)
  }, [registeredEmail, resendVerification])

  if (registeredEmail) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-600">
            <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-stone-900">Cek Email Anda</h2>
        <p className="text-sm text-stone-500">
          Kami telah mengirim email verifikasi ke <span className="font-medium text-stone-700">{registeredEmail}</span>.
          Silakan klik link di email untuk memverifikasi akun Anda.
        </p>
        <p className="text-xs text-stone-400">
          {resent ? (
            'Email verifikasi telah dikirim ulang!'
          ) : (
            <>Tidak menerima email? Periksa folder spam atau{' '}
              <button
                onClick={handleResend}
                className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
              >
                kirim ulang
              </button>
            </>
          )}
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
        <h2 className="text-lg font-semibold text-stone-900">Buat Akun</h2>
        <p className="mt-1 text-sm text-stone-500">Daftar untuk mengelola dashboard WANI</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        <Input
          label="Nama"
          value={name}
          onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: '' })) }}
          placeholder="Nama lengkap"
          prefix={<UserIcon />}
          error={fieldErrors.name}
          inputSize="lg"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })) }}
          placeholder="email@contoh.com"
          prefix={<MailIcon />}
          error={fieldErrors.email}
          inputSize="lg"
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })) }}
          placeholder="Minimal 8 karakter"
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
        <Input
          label="Konfirmasi Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })) }}
          placeholder="Ulangi password"
          prefix={<LockIcon />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-stone-400 hover:text-stone-600"
            >
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
          error={fieldErrors.confirmPassword}
          inputSize="lg"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Daftar
      </Button>

      <p className="text-center text-sm text-stone-500">
        Sudah punya akun?{' '}
        <Link to="/app/login" className="font-medium text-teal-600 hover:text-teal-700">
          Masuk
        </Link>
      </p>
    </form>
  )
}
