'use client';

import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-surface-900">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-surface-500">Total Pesanan</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">0</p>
        </Card>
        <Card>
          <p className="text-sm text-surface-500">Total Produk</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">0</p>
        </Card>
        <Card>
          <p className="text-sm text-surface-500">Pelanggan</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">0</p>
        </Card>
        <Card>
          <p className="text-sm text-surface-500">Pesanan Baru</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">0</p>
        </Card>
      </div>
    </div>
  );
}
