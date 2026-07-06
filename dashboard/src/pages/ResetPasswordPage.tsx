import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Spinner from '@/components/ui/Spinner.tsx'
import Button from '@/components/ui/Button.tsx'
import Input from '@/components/ui/Input.tsx'
import { LockIcon, EyeIcon, EyeOffIcon } from '@/components/Icons.tsx'
import { fetchApi } from '@/lib/api.ts'

type PageState = 'form' | 'loading' | 'success' | 'error'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<PageState>(token ? 'form' : 'error')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState(token ? '' : 'Token reset tidak ditemukan')
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})

  function validate() {
    const errors: { password?: string; confirm?: string } = {}
    if (!password) errors.password = 'Password wajib diisi'
    else if (password.length < 8) errors.password = 'Minimal 8 karakter'
    if (!confirm) errors.confirm = 'Konfirmasi password wajib diisi'
    else if (confirm !== password) errors.confirm = 'Password tidak cocok'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setState('loading')
    setError('')
    try {
      await fetchApi('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      setState('success')
    } catch (err) {
      setState('form')
      setError(err instanceof Error ? err.message : 'Gagal reset password')
    }
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Spinner size={32} />
        <p className="text-sm text-stone-500">Mereset password Anda...</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-600">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-stone-900">Password Berhasil Diubah!</h2>
        <p className="text-sm text-stone-500">Silakan masuk dengan password baru Anda.</p>
        <Link to="/login">
          <Button size="lg" className="mt-2">Masuk ke Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-stone-900">Reset Password</h2>
        <p className="mt-1 text-sm text-stone-500">Buat password baru untuk akun Anda</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {!token && (
            <p className="mt-2 text-xs text-red-500">
              Link reset tidak valid. Silakan{' '}
              <Link to="/forgot-password" className="font-medium underline underline-offset-2">
                minta tautan baru
              </Link>.
            </p>
          )}
        </div>
      )}

      {token && (
        <>
          <div className="space-y-4">
            <Input
              label="Password Baru"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
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
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setFieldErrors((p) => ({ ...p, confirm: undefined })) }}
              placeholder="Ulangi password baru"
              prefix={<LockIcon />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
              error={fieldErrors.confirm}
              inputSize="lg"
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Ubah Password
          </Button>
        </>
      )}

      <p className="text-center text-sm text-stone-500">
        <Link to="/login" className="font-medium text-teal-600 hover:text-teal-700">
          Kembali ke Login
        </Link>
      </p>
    </form>
  )
}
