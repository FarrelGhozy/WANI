const DB_NAME = 'WANI';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-primary-600">{DB_NAME}</h1>
      <p className="mt-2 text-surface-500">WA Niaga untuk UMKM</p>
      <div className="mt-8 flex gap-4">
        <a
          href="/dashboard"
          className="rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700 transition-colors"
        >
          Dashboard
        </a>
        <a
          href="/store"
          className="rounded-lg border border-primary-600 px-6 py-3 text-primary-600 hover:bg-primary-50 transition-colors"
        >
          Web Store
        </a>
      </div>
    </main>
  );
}
