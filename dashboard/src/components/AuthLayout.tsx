import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg sm:p-10">
        <div className="mb-8 flex flex-col items-center">
          <svg viewBox="0 0 180 48" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="4" width="38" height="38" rx="10" fill="url(#bubble)" />
            <path d="M 34 15 L 41 18 L 34 23 Z" fill="url(#bubble)" />
            <path d="M 10 19 L 14 34 L 19.5 23 L 25 34 L 29 19" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="32" fill="#064e3b" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="27" letter-spacing="-0.5">WAN</text>
            <text x="113" y="32" fill="#f59e0b" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="27" letter-spacing="-0.5">I</text>
            <defs>
              <linearGradient id="bubble" x1="0" y1="0" x2="1" y2="1">
                <stop stop-color="#059669" />
                <stop stop-color="#047857" offset="1" />
              </linearGradient>
            </defs>
          </svg>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-stone-400">Dashboard</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
