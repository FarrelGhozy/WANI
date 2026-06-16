'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  History,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';

interface WASession {
  id: string;
  status: string;
  qrCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger'; icon: typeof Wifi }> = {
  connected: { label: 'Tersambung', variant: 'success', icon: Wifi },
  connecting: { label: 'Menghubungkan', variant: 'warning', icon: Loader2 },
  disconnected: { label: 'Terputus', variant: 'danger', icon: WifiOff },
  expired: { label: 'Kedaluwarsa', variant: 'danger', icon: XCircle },
};

export default function WASessionPage() {
  const [session, setSession] = useState<WASession | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [qrExpiry, setQrExpiry] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await api.get<{ data: WASession }>('/wa-session/me/status');
    if (res.success) {
      setSession(res.data.data);
      if (res.data.data.qrCode) setQrExpiry(60);
    }
    setLoading(false);
  }, []);

  const fetchActivity = useCallback(async () => {
    const res = await api.get<{ data: ActivityLog[] }>('/dashboard/activity?limit=10');
    if (res.success) setActivity(res.data.data);
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchActivity();
    const interval = setInterval(() => {
      fetchStatus();
      setQrExpiry(p => Math.max(0, p - 5));
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchActivity]);

  async function handleConnect() {
    setConnecting(true);
    const res = await api.post<{ data: WASession }>('/wa-session/me/connect', {});
    if (res.success) {
      setSession(res.data.data);
      setQrExpiry(60);
    }
    setConnecting(false);
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    await api.post('/wa-session/me/disconnect', {});
    setConfirmDisconnect(false);
    setDisconnecting(false);
    fetchStatus();
    fetchActivity();
  }

  const statusInfo = session ? statusConfig[session.status] || statusConfig.disconnected : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-surface-900">Koneksi WhatsApp</h1>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Status Koneksi
            </CardTitle>
          </CardHeader>

          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {statusInfo && (
                  <statusInfo.icon className={`h-10 w-10 ${
                    statusInfo.variant === 'success' ? 'text-green-500' :
                    statusInfo.variant === 'warning' ? 'text-yellow-500 animate-spin' :
                    'text-red-500'
                  }`} />
                )}
                <div>
                  <p className="text-lg font-semibold text-surface-900">
                    {statusInfo?.label || 'Memuat...'}
                  </p>
                  {session?.status === 'connected' && (
                    <p className="text-sm text-surface-400">
                      Tersambung sejak {new Date(session.updatedAt).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {(session?.status === 'disconnected' || session?.status === 'expired') && (
                  <Button onClick={handleConnect} loading={connecting}>
                    <RefreshCw className="h-4 w-4" />
                    Sambungkan
                  </Button>
                )}
                {session?.status === 'connected' && (
                  <Button variant="danger" onClick={() => setConfirmDisconnect(true)}>
                    <WifiOff className="h-4 w-4" />
                    Putuskan Koneksi
                  </Button>
                )}
                {session?.status === 'connecting' && (
                  <Button disabled>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menghubungkan...
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        {(session?.status === 'disconnected' || session?.status === 'expired') && session?.qrCode && (
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
            </CardHeader>
            <div className="flex flex-col items-center gap-4">
              {loading ? (
                <Skeleton className="h-64 w-64" />
              ) : (
                <img
                  src={session.qrCode}
                  alt="WhatsApp QR Code"
                  className="h-64 w-64 rounded-lg border border-surface-200"
                />
              )}
              <p className="text-sm text-surface-500">
                QR akan kedaluwarsa dalam {qrExpiry} detik
              </p>
              <Button variant="outline" onClick={handleConnect} loading={connecting}>
                <RefreshCw className="h-4 w-4" />
                Muat Ulang QR
              </Button>
            </div>
          </Card>
        )}

        {session?.status === 'disconnected' && !session?.qrCode && (
          <Card>
            <CardHeader>
              <CardTitle>Cara Menghubungkan</CardTitle>
            </CardHeader>
            <ol className="space-y-3 list-decimal list-inside text-sm text-surface-700">
              <li>Buka WhatsApp di ponselmu</li>
              <li>Tap titik tiga &gt; Perangkat Tertaut</li>
              <li>Tap &quot;Tautkan Perangkat&quot;</li>
              <li>Klik tombol &quot;Sambungkan&quot; di atas</li>
              <li>Scan QR code yang muncul</li>
              <li>Selesai! Pesanan akan otomatis masuk.</li>
            </ol>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Riwayat Koneksi
            </CardTitle>
          </CardHeader>
          {activity.length === 0 ? (
            <p className="text-sm text-surface-400 py-4 text-center">Belum ada aktivitas</p>
          ) : (
            <div className="divide-y divide-surface-100">
              {activity.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-surface-500">
                    {a.type === 'wa_connected' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                     a.type === 'wa_disconnected' ? <XCircle className="h-4 w-4 text-red-500" /> :
                     <History className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-700 truncate">{a.description}</p>
                    <p className="text-xs text-surface-400">{relativeTime(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={confirmDisconnect} onClose={() => setConfirmDisconnect(false)} title="Putuskan Koneksi WA">
        <p className="text-sm text-surface-600 mb-6">
          Yakin putuskan koneksi WhatsApp? Pelanggan tidak akan bisa mengirim pesan melalui WA.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDisconnect(false)}>Batal</Button>
          <Button variant="danger" onClick={handleDisconnect} loading={disconnecting}>
            {disconnecting ? 'Memutuskan...' : 'Putuskan'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
