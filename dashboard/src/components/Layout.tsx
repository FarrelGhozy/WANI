import { Outlet } from 'react-router'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">WANI Dashboard</h1>
        <p className="text-sm text-gray-500">WhatsApp Bot Monitor</p>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
