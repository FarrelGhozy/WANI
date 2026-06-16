'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Users,
  AlertCircle,
  X,
  ShoppingCart,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatRupiah, relativeTime } from '@/lib/format';

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  notes: string | null;
  createdAt: string;
}

interface CustomerDetail extends Customer {
  orders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

const statusBadge: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Dikonfirmasi',
  PROCESSING: 'Diproses',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export default function CustomersPageWrapper() {
  return (
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>}>
      <CustomersPage />
    </Suspense>
  );
}

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [detailCustomer, setDetailCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const limit = 10;

  const fetchCustomers = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    const res = await api.get<{ data: Customer[]; meta: { total: number } }>(`/customers?${params}`);
    if (res.success) {
      setCustomers(res.data.data);
      setTotal(res.data.meta.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filteredCustomers = searchQuery
    ? customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))
    : customers;

  async function openDetail(id: string) {
    setDetailLoading(true);
    const res = await api.get<{ data: CustomerDetail }>(`/customers/${id}`);
    if (res.success) setDetailCustomer(res.data.data);
    setDetailLoading(false);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-surface-900">Pelanggan</h1>

      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Cari nama atau nomor WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-surface-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </div>
      </Card>

      {loading ? (
        <Card><div className="space-y-4"><Skeleton className="h-8 w-full"/><Skeleton className="h-8 w-full"/><Skeleton className="h-8 w-full"/></div></Card>
      ) : error ? (
        <Card><div className="flex flex-col items-center gap-3 py-12"><AlertCircle className="h-10 w-10 text-red-400"/><p>{error}</p><Button variant="outline" onClick={fetchCustomers}>Coba Lagi</Button></div></Card>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-16">
            <Users className="h-12 w-12 text-surface-300" />
            <h3 className="text-lg font-semibold text-surface-700">
              {searchQuery ? `Tidak ada pelanggan "${searchQuery}"` : 'Belum ada pelanggan'}
            </h3>
          </div>
        </Card>
      ) : (
        <>
          <Card padding={false}>
            <div className="p-4 text-sm text-surface-500 border-b border-surface-200">
              Menampilkan {filteredCustomers.length} dari {total} pelanggan
            </div>
            <Table<Customer>
              keyField="id"
              columns={[
                {
                  key: 'name',
                  header: 'Pelanggan',
                  cell: (row) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                        {row.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">{row.name}</p>
                        <p className="text-xs text-surface-400">{row.phone.replace(/^(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'totalOrders',
                  header: 'Pesanan',
                  cell: (row) => <span>{row.totalOrders}</span>,
                },
                {
                  key: 'createdAt',
                  header: 'Bergabung',
                  cell: (row) => <span className="text-sm text-surface-500">{new Date(row.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>,
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  cell: (row) => (
                    <Button size="sm" variant="outline" onClick={() => openDetail(row.id)}>Detail</Button>
                  ),
                },
              ]}
              data={filteredCustomers}
            />
          </Card>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
              <span className="text-sm text-surface-500">Hal {page} dari {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya</Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!detailCustomer} onClose={() => setDetailCustomer(null)} title="Detail Pelanggan" className="max-w-lg">
        {detailLoading ? (
          <div className="space-y-3"><Skeleton className="h-8 w-full"/><Skeleton className="h-8 w-full"/></div>
        ) : detailCustomer ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                {detailCustomer.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-surface-900">{detailCustomer.name}</p>
                <p className="text-sm text-surface-400">{detailCustomer.phone.replace(/^(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</p>
                <p className="text-xs text-surface-400">Pelanggan sejak {new Date(detailCustomer.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center">
                <p className="text-2xl font-bold text-surface-900">{detailCustomer.totalOrders}</p>
                <p className="text-xs text-surface-500">Total Pesanan</p>
              </Card>
            </div>

            {detailCustomer.orders && detailCustomer.orders.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Riwayat Pesanan</h4>
                <div className="divide-y divide-surface-100">
                  {detailCustomer.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-surface-400" />
                        <span className="text-sm text-surface-700">#{order.id.slice(0, 8)}</span>
                        <Badge variant={statusBadge[order.status] || 'default'}>{statusLabel[order.status] || order.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{formatRupiah(order.totalAmount)}</span>
                        <span className="text-xs text-surface-400">{new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailCustomer.notes && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Catatan</h4>
                <p className="text-sm text-surface-700 bg-surface-50 rounded-lg p-3">{detailCustomer.notes}</p>
              </div>
            )}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
