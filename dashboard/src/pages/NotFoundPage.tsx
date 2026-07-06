import { Link } from 'react-router'
import Button from '@/components/ui/Button.tsx'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg sm:p-10">
        <div className="mb-6 flex justify-center">
          <img src="/logo.png" alt="WANI" className="h-10 w-auto" />
        </div>
        <div className="space-y-5 text-center">
          <p className="text-6xl font-bold text-teal-600">404</p>
          <h2 className="text-lg font-semibold text-stone-900">Halaman Tidak Ditemukan</h2>
          <p className="text-sm text-stone-500">
            Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link to="/">
              <Button size="lg" className="w-full">Kembali ke Beranda</Button>
            </Link>
            <Link
              to="/login"
              className="text-center text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
