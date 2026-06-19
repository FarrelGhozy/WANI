'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Loader2, RefreshCw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface WaStatusData {
  status: string;
  phone: string | null;
  connectedSince: string | null;
}

export function WaStatusBadge() {
  const router = useRouter();
  const [data, setData] = useState<WaStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await api.get<{ data: WaStatusData }>('/wa-session/me/status');
    if (res.success) setData(res.data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleConnect(e: React.MouseEvent) {
    e.stopPropagation();
    setConnecting(true);
    await api.post('/wa-session/me/connect', {});
    setTimeout(fetchStatus, 2000);
    setConnecting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-surface-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Memeriksa koneksi...
      </div>
    );
  }

  const isConnected = data?.status === 'connected';
  const isConnecting = data?.status === 'connecting';

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border px-3 py-2 transition-colors',
        isConnected
          ? 'border-green-200 bg-green-50'
          : isConnecting
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-red-200 bg-red-50',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isConnected ? (
          <Wifi className="h-4 w-4 shrink-0 text-green-600" />
        ) : isConnecting ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-yellow-500" />
        ) : (
          <WifiOff className="h-4 w-4 shrink-0 text-red-500" />
        )}
        <span
          className={cn(
            'text-xs font-medium',
            isConnected && 'text-green-700',
            isConnecting && 'text-yellow-700',
            !isConnected && !isConnecting && 'text-red-700',
          )}
        >
          {isConnected
            ? 'WhatsApp Tersambung'
            : isConnecting
              ? 'Menghubungkan...'
              : 'WhatsApp Terputus'}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!isConnected && !isConnecting && (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {connecting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Sambungkan
          </button>
        )}
        <button
          onClick={() => router.push('/dashboard/wa-session')}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-surface-600 hover:bg-surface-100 transition-colors"
        >
          <Settings className="h-3 w-3" />
          Atur
        </button>
      </div>
    </div>
  );
}
