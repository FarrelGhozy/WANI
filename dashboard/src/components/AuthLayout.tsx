import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 px-4 py-12">
      <div className="mb-8 w-full max-w-md flex justify-center">
        <img src="/logo.png" alt="WANI" className="h-10 w-auto" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg sm:p-10">
        <Outlet />
      </div>
    </div>
  )
}
