import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 px-4 py-12">
      <div className="mb-8 w-full max-w-md">
        <svg viewBox="0 0 180 48" className="mx-auto h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="4" width="38" height="38" rx="10" fill="white" fill-opacity="0.15" />
          <path d="M 34 15 L 41 18 L 34 23 Z" fill="white" fill-opacity="0.15" />
          <path d="M 10 19 L 14 34 L 19.5 23 L 25 34 L 29 19" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
          <text x="52" y="32" fill="#ecfdf5" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="27" letter-spacing="-0.5">WAN</text>
          <text x="113" y="32" fill="#fcd34d" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="27" letter-spacing="-0.5">I</text>
        </svg>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg sm:p-10">
        <Outlet />
      </div>
    </div>
  )
}
