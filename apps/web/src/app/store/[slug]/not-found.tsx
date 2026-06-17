import { Store } from 'lucide-react';

export default function StoreNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-50 p-8 text-center">
      <Store className="h-16 w-16 text-surface-300" />
      <h1 className="text-2xl font-bold text-surface-800">Toko Tidak Ditemukan</h1>
      <p className="text-surface-500">Toko dengan tautan ini tidak tersedia atau belum diterbitkan.</p>
    </div>
  );
}
