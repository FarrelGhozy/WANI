import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 ring-4 ring-teal-100">
            <span className="text-xl font-bold tracking-tight text-white">W</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">WANI</h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-stone-400">Dashboard</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
