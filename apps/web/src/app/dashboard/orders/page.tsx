'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  X,
  ChevronRight,
  ShoppingCart,
  MessageSquare,
  Globe,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Loading } from '@/components/ui/loading';
import { api } from '@/lib/api';
import { formatRupiah, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

interface OrderItem {
  id: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  product: { id: string; name: string; price: number };
}

interface OrderCustomer {
  id: string;
  name: string;
  phone: string;
}

interface OrderPayment {
  id: string;
  method: string | null;
  amount: number;
  status: string;
}

interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  source: string;
  notes: string | null;
  createdAt: string;
  customer: OrderCustomer;
  items: OrderItem[];
  payment: OrderPayment | null;
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'danger' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  CONFIRMED: { label: 'Dikonfirmasi', variant: 'info' },
  PROCESSING: { label: 'Diproses', variant: 'info' },
  COMPLETED: { label: 'Selesai', variant: 'success' },
  CANCELLED: { label: 'Dibatalkan', variant: 'danger' },
};

const statusTabs: { value: string; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

const nextActions: Record<OrderStatus, { label: string; to: OrderStatus }[]> = {
  PENDING: [
    { label: 'Konfirmasi', to: 'CONFIRMED' },
    { label: 'Batalkan', to: 'CANCELLED' },
  ],
  CONFIRMED: [
    { label: 'Proses', to: 'PROCESSING' },
    { label: 'Batalkan', to: 'CANCELLED' },
  ],
  PROCESSING: [
    { label: 'Selesaikan', to: 'COMPLETED' },
    { label: 'Batalkan', to: 'CANCELLED' },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

const sourceIcon: Record<string, typeof MessageSquare> = {
  wa_chat: MessageSquare,
  web_store: Globe,
};

const sourceLabel: Record<string, string> = {
  wa_chat: 'WA Chat',
  web_store: 'Web Store',
};

export default function OrdersPageWrapper() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-200" />
        ))}
      </div>
    }>
      <OrdersPage />
    </Suspense>
  );
}

function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const statusFilter = searchParams.get('status') || '';
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{ order: Order; to: OrderStatus } | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const limit = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (statusFilter) params.set('status', statusFilter);

    const res = await api.get<{ data: Order[]; meta: { total: number } }>(
      `/orders?${params}`,
    );
    if (res.success) {
      setOrders(res.data.data);
      setTotal(res.data.meta.total);
      setError('');
    } else {
      setError(res.error || 'Gagal memuat pesanan');
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const filteredOrders = searchQuery
    ? orders.filter(
        (o) =>
          o.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : orders;

  async function openDetail(orderId: string) {
    setDetailLoading(true);
    setDetailError('');
    setSelectedOrder(null);
    const res = await api.get<{ data: Order }>(`/orders/${orderId}`);
    if (res.success) {
      setSelectedOrder(res.data.data);
    } else {
      setDetailError(res.error || 'Gagal memuat detail');
    }
    setDetailLoading(false);
  }

  function setStatusTab(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) params.set('status', status);
    else params.delete('status');
    router.push(`/dashboard/orders?${params}`);
  }

  async function handleTransition() {
    if (!confirmDialog) return;
    setTransitioning(true);
    const res = await api.put(`/orders/${confirmDialog.order.id}/status`, {
      status: confirmDialog.to,
    });
    setTransitioning(false);
    if (res.success) {
      setConfirmDialog(null);
      setSelectedOrder(null);
      fetchOrders();
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-surface-900">Pesanan</h1>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Cari pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-surface-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const isActive = (tab.value === '' && statusFilter === '') || tab.value === statusFilter;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusTab(tab.value)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200',
              )}
            >
              {tab.label}
            </button>
          );
        })}
        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
            <X className="h-4 w-4" /> Reset
          </Button>
        )}
      </div>

      {loading ? (
        <Card>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-surface-500">{error}</p>
            <Button onClick={fetchOrders} variant="outline">Coba Lagi</Button>
          </div>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-16">
            <ShoppingCart className="h-12 w-12 text-surface-300" />
            <h3 className="text-lg font-semibold text-surface-700">
              {searchQuery ? 'Tidak ada pesanan' : 'Belum ada pesanan'}
            </h3>
            <p className="text-sm text-surface-400">
              {searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}"`
                : 'Bagikan nomor WA ke pelanggan untuk mulai menerima pesanan.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const cfg = statusConfig[order.status];
              const Icon = sourceIcon[order.source] || MessageSquare;
              return (
                <div
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(order.id)}
                  onKeyDown={(e) => e.key === 'Enter' && openDetail(order.id)}
                  className="cursor-pointer rounded-xl border border-surface-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-surface-400">
                          #{order.id.slice(0, 8)}
                        </span>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <div className="flex items-center gap-1 text-xs text-surface-400">
                          <Icon className="h-3 w-3" />
                          {sourceLabel[order.source] || order.source}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-surface-900">
                          {order.customer.name}
                        </span>
                        <span className="text-sm text-surface-500">
                          {order.items.length} item
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
                        <span>{formatRupiah(order.totalAmount)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relativeTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-surface-300 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Sebelumnya
              </Button>
              <span className="text-sm text-surface-500">Hal {page} dari {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Selanjutnya
              </Button>
            </div>
          )}
        </>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}
        >
          <div className="w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-surface-900">
                #{selectedOrder.id.slice(0, 8)}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <Loading className="py-20" />
            ) : detailError ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm text-surface-500">{detailError}</p>
                <Button variant="outline" size="sm" onClick={() => openDetail(selectedOrder.id)}>
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <Badge variant={statusConfig[selectedOrder.status].variant}>
                    {statusConfig[selectedOrder.status].label}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
                    Pelanggan
                  </h4>
                  <p className="font-medium text-surface-900">{selectedOrder.customer.name}</p>
                  <p className="text-sm text-surface-500">{selectedOrder.customer.phone}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
                    Pesanan
                  </h4>
                  <div className="divide-y divide-surface-100">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-surface-900">{item.product.name}</p>
                          <p className="text-xs text-surface-400">
                            {item.qty}x @ {formatRupiah(item.unitPrice)}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-surface-900">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-surface-200">
                    <span className="font-semibold text-surface-900">Total</span>
                    <span className="font-bold text-lg text-surface-900">
                      {formatRupiah(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                {selectedOrder.payment && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
                      Pembayaran
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-surface-700">
                        {selectedOrder.payment.method || '-'}
                      </span>
                      <Badge
                        variant={
                          selectedOrder.payment.status === 'PAID' ? 'success' : 'warning'
                        }
                      >
                        {selectedOrder.payment.status === 'PAID' ? 'Lunas' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
                      Catatan
                    </h4>
                    <p className="text-sm text-surface-700 bg-surface-50 rounded-lg p-3">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {nextActions[selectedOrder.status].length > 0 && (
                  <div className="pt-4 border-t border-surface-200">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
                      Aksi
                    </h4>
                    <div className="flex gap-3">
                      {nextActions[selectedOrder.status]
                        .filter(a => a.to !== 'CANCELLED')
                        .map((action) => (
                          <Button
                            key={action.to}
                            size="sm"
                            onClick={() => setConfirmDialog({ order: selectedOrder, to: action.to })}
                          >
                            {action.label}
                          </Button>
                        ))}
                      {nextActions[selectedOrder.status].some(a => a.to === 'CANCELLED') && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setConfirmDialog({
                              order: selectedOrder,
                              to: 'CANCELLED' as OrderStatus,
                            })
                          }
                        >
                          Batalkan
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog?.to === 'CANCELLED' ? 'Batalkan Pesanan' : 'Konfirmasi'}
      >
        <p className="text-sm text-surface-600 mb-6">
          {confirmDialog?.to === 'CANCELLED'
            ? `Yakin batalkan pesanan #${confirmDialog?.order.id.slice(0, 8)}?`
            : `Ubah status pesanan #${confirmDialog?.order.id.slice(0, 8)} menjadi ${confirmDialog ? statusConfig[confirmDialog.to].label : ''}?`}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDialog(null)}>Batal</Button>
          <Button
            variant={confirmDialog?.to === 'CANCELLED' ? 'danger' : 'primary'}
            onClick={handleTransition}
            loading={transitioning}
          >
            {transitioning ? 'Memproses...' : 'Konfirmasi'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
