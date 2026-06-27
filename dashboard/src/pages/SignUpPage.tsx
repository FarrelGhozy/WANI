import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth.ts'
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, UserIcon } from '@/components/Icons.tsx'
import Button from '@/components/ui/Button.tsx'
import Input from '@/components/ui/Input.tsx'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { register, loading, error } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

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
    if (success) navigate('/', { replace: true })
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
        <Link to="/login" className="font-medium text-teal-600 hover:text-teal-700">
          Masuk
        </Link>
      </p>
    </form>
  )
}
