'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Package,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Bot,
  RefreshCw,
  QrCode,
  Plus,
  MessageSquare,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { relativeTime, formatRupiah } from '@/lib/format';

interface Stats {
  totalOrders: number;
  revenue: number;
  revenueGrowth: number;
  aiHandleRate: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  source: string;
  createdAt: string;
  previewMessage: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

const statusVariant: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
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

const activityIcon: Record<string, typeof MessageSquare> = {
  order_created: ShoppingCart,
  order_status: ShoppingCart,
  ai_reply: Bot,
  human_reply: MessageSquare,
  payment_received: CreditCard,
  customer_added: Users,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, activityRes] = await Promise.all([
        api.get<{ data: Stats }>('/dashboard/stats'),
        api.get<{ data: RecentOrder[] }>('/dashboard/recent-orders?limit=5'),
        api.get<{ data: Activity[] }>('/dashboard/activity?limit=8'),
      ]);

      if (statsRes.success) setStats(statsRes.data.data);
      if (ordersRes.success) setOrders(ordersRes.data.data);
      if (activityRes.success) setActivity(activityRes.data.data);

      if (!statsRes.success && !ordersRes.success && !activityRes.success) {
        setError('Gagal memuat data');
      } else {
        setError('');
      }
    } catch {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const isEmpty = stats && stats.totalOrders === 0 && stats.totalProducts === 0;

  if (error && !stats && !loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-surface-500">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Overview</h1>
        <Button onClick={fetchData} variant="ghost" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isEmpty && (
        <Card className="mb-6 bg-gradient-to-br from-primary-50 to-blue-50 border-primary-100">
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-semibold text-surface-900 mb-2">
              Selamat Datang di WANI!
            </h2>
            <p className="text-sm text-surface-500 mb-6 max-w-md mx-auto">
              Mulai jualan online dengan menghubungkan WhatsApp dan menambahkan produk.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/dashboard/wa-session">
                <Button>
                  <QrCode className="h-4 w-4" />
                  Connect WA
                </Button>
              </Link>
              <Link href="/dashboard/products">
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                  Tambah Produk
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          icon={ShoppingCart}
          label="Total Pesanan"
          value={stats?.totalOrders}
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Pendapatan Bulan Ini"
          value={stats ? formatRupiah(stats.revenue) : undefined}
          loading={loading}
        />
        <StatCard
          icon={Bot}
          label="AI Handle Rate"
          value={stats ? `${stats.aiHandleRate}%` : undefined}
          loading={loading}
          progress={stats?.aiHandleRate}
        />
        <StatCard
          icon={stats?.revenueGrowth && stats.revenueGrowth >= 0 ? TrendingUp : TrendingDown}
          label="Pertumbuhan"
          value={stats ? `${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%` : undefined}
          loading={loading}
          positive={stats ? stats.revenueGrowth >= 0 : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Baru</CardTitle>
            <Link
              href="/dashboard/orders"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Lihat Semua &rarr;
            </Link>
          </CardHeader>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-surface-400 py-8 text-center">
              Belum ada pesanan. Scan QR WA untuk mulai.
            </p>
          ) : (
            <div className="divide-y divide-surface-100">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 cursor-pointer hover:bg-surface-50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-surface-900">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-surface-400 truncate">
                      {order.previewMessage}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-surface-900">
                      {formatRupiah(order.totalAmount)}
                    </span>
                    <Badge variant={statusVariant[order.status] || 'default'}>
                      {statusLabel[order.status] || order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <Link
              href="/dashboard/chats"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Lihat Semua &rarr;
            </Link>
          </CardHeader>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-surface-400 py-8 text-center">
              Belum ada aktivitas.
            </p>
          ) : (
            <div className="divide-y divide-surface-100">
              {activity.map((act) => {
                const Icon = activityIcon[act.type] || Clock;
                return (
                  <div
                    key={act.id}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-surface-500">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-surface-700">
                        {act.description}
                      </p>
                      <p className="text-xs text-surface-400">
                        {relativeTime(act.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  progress,
  positive,
}: {
  icon: typeof ShoppingCart;
  label: string;
  value?: string | number;
  loading: boolean;
  progress?: number;
  positive?: boolean;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-surface-500">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="flex items-center gap-1 text-2xl font-bold text-surface-900">
              {value ?? '-'}
              {positive !== undefined && (
                positive
                  ? <TrendingUp className="h-5 w-5 text-green-500" />
                  : <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {progress !== undefined && !loading && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-200">
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </Card>
  );
}
