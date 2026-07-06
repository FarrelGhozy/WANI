import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Spinner from '@/components/ui/Spinner.tsx'
import Button from '@/components/ui/Button.tsx'
import { fetchApi } from '@/lib/api.ts'

type VerifyState = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? '' : 'Token verifikasi tidak ditemukan')

  useEffect(() => {
    if (!token) return

    let cancelled = false

    ;(async () => {
      try {
        const res = await fetchApi(`/auth/verify-email?token=${encodeURIComponent(token)}`)
        if (!cancelled) {
          setState('success')
          setMessage(res.message)
        }
      } catch (e) {
        if (!cancelled) {
          setState('error')
          setMessage(e instanceof Error ? e.message : 'Verifikasi gagal')
        }
      }
    })()

    return () => { cancelled = true }
  }, [token])

  return (
    <div className="space-y-5 text-center">
      {state === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Spinner size={32} />
          <p className="text-sm text-stone-500">Memverifikasi email Anda...</p>
        </div>
      )}

      {state === 'success' && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">Email Berhasil Diverifikasi!</h2>
          <p className="text-sm text-stone-500">{message}</p>
          <Link to="/login">
            <Button size="lg" className="mt-2">Masuk ke Dashboard</Button>
          </Link>
        </>
      )}

      {state === 'error' && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">Verifikasi Gagal</h2>
          <p className="text-sm text-stone-500">{message}</p>
          <p className="text-xs text-stone-400">
            Link verifikasi mungkin sudah kadaluarsa. Coba daftar ulang atau{' '}
            <Link to="/login" className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2">
              login
            </Link>{' '}
            untuk mengirim ulang verifikasi.
          </p>
        </>
      )}
    </div>
  )
}
