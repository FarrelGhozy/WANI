import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth.ts'
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, UserIcon } from '@/components/Icons.tsx'
import Button from '@/components/ui/Button.tsx'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { register, loading, error } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    await register(name.trim(), email, password)
    if (!error) navigate('/', { replace: true })
  }

  function renderField(label: string, icon: React.ReactNode, field: string, type: string, value: string, onChange: (v: string) => void, placeholder: string, extra?: React.ReactNode) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">{icon}</span>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`h-11 w-full rounded-lg border bg-white pl-10 pr-10 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${fieldErrors[field] ? 'border-red-400' : 'border-stone-300'}`}
          />
          {extra}
        </div>
        {fieldErrors[field] && <p className="text-xs text-red-500">{fieldErrors[field]}</p>}
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
        {renderField('Nama', <UserIcon />, 'name', 'text', name, setName, 'Nama lengkap')}
        {renderField('Email', <MailIcon />, 'email', 'email', email, setEmail, 'email@contoh.com')}
        {renderField('Password', <LockIcon />, 'password', showPassword ? 'text' : 'password', password, setPassword, 'Minimal 8 karakter', (
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ))}
        {renderField('Konfirmasi Password', <LockIcon />, 'confirmPassword', showPassword ? 'text' : 'password', confirmPassword, setConfirmPassword, 'Ulangi password')}
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
