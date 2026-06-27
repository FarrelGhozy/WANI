import { useState } from 'react'
import Card from '@/components/ui/Card.tsx'
import Button from '@/components/ui/Button.tsx'
import QRCode from '@/components/QRCode.tsx'
import { formatDate } from '@/utils/format'

interface WaSessionTabProps {
  qr: string
  connection: string
  phone: string
  connectedAt: string | null
  onDisconnect: () => void
  onConnect: () => void
  onReset: () => void
  resetting: boolean
}

const statusConfig: Record<string, { dot: string; label: string; bg: string }> = {
  connected: {
    dot: 'bg-emerald-500',
    label: 'Terhubung',
    bg: 'bg-emerald-50',
  },
  disconnected: {
    dot: 'bg-stone-400',
    label: 'Terputus',
    bg: 'bg-stone-50',
  },
  connecting: {
    dot: 'bg-amber-500',
    label: 'Menghubungkan...',
    bg: 'bg-amber-50',
  },
}

const isMockQr = (qr: string) => !qr || qr === 'mock-qr-data-for-development'

export default function WaSessionTab({ qr, connection, phone, connectedAt, onDisconnect, onReset, resetting }: WaSessionTabProps) {
  const [confirming, setConfirming] = useState(false)
  const cfg = statusConfig[connection] ?? statusConfig.disconnected
  const canDisconnect = connection === 'connected'

  const handleReset = () => {
    if (confirming) {
      setConfirming(false)
      onReset()
    } else {
      setConfirming(true)
    }
  }

  const resetButton = confirming ? (
    <div className="mt-4 flex items-center gap-2">
      <Button size="sm" variant="danger" disabled={resetting} onClick={handleReset}>
        {resetting ? 'Mereset...' : 'Konfirmasi Reset'}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
        Batal
      </Button>
    </div>
  ) : (
    <Button
      size="sm"
      variant="danger"
      className="mt-4"
      disabled={resetting}
      onClick={handleReset}
    >
      {resetting ? 'Mereset...' : 'Reset Koneksi'}
    </Button>
  )

  return (
    <div className="space-y-6">
      <Card accent="teal">
        <h2 className="mb-6 text-lg font-semibold text-stone-900">WhatsApp Session</h2>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className={`rounded-lg p-4 ${cfg.bg}`}>
            <p className="text-xs text-stone-500">Status</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
              <span className="text-sm font-medium text-stone-900">{cfg.label}</span>
            </div>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Nomor Telepon</p>
            <p className="mt-1 text-sm font-medium text-stone-900">
              {phone || '-'}
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Aksi</p>
            <div className="mt-1 flex gap-2">
              {canDisconnect ? (
                  <Button size="sm" variant="danger" onClick={onDisconnect}>
                    Putuskan
                  </Button>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  disabled={resetting}
                  onClick={handleReset}
                >
                  {resetting ? 'Mereset...' : 'Reset Koneksi'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {connection === 'connected' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-600">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">WhatsApp Terhubung</p>
                <p className="text-xs text-emerald-600">Session aktif dan melayani pelanggan</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SessionInfo label="Telepon" value={phone} />
              <SessionInfo label="Platform" value="WhatsApp Web" />
              <SessionInfo label="Terhubung Sejak" value={connectedAt ? formatDate(connectedAt, { long: true, withTz: true }) : '-'} />
              <SessionInfo label="Terakhir Aktif" value="Sekarang" />
            </div>
          </div>
        )}

        {(connection === 'disconnected' || connection === 'connecting') && (
          <div className="flex flex-col items-center rounded-lg bg-stone-50 p-6">
            {isMockQr(qr) ? (
              <>
                <div className="mb-4 flex aspect-square w-[200px] items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-white">
                  <div className="text-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-stone-300">
                      <rect x="2" y="2" width="8" height="8" rx="1" />
                      <rect x="14" y="2" width="8" height="8" rx="1" />
                      <rect x="2" y="14" width="8" height="8" rx="1" />
                      <rect x="14" y="14" width="4" height="4" rx="1" />
                      <rect x="20" y="14" width="2" height="4" rx="0.5" />
                      <rect x="14" y="20" width="4" height="2" rx="0.5" />
                    </svg>
                    <p className="mt-2 text-xs text-stone-400">Menunggu QR Code...</p>
                  </div>
                </div>
                <p className="text-center text-xs font-medium text-stone-500">
                  Jika QR Code tidak muncul, reset koneksi untuk memulai ulang proses pairing.
                </p>
              </>
            ) : (
              <>
                <p className="mb-3 text-xs font-medium text-stone-500">
                  Scan QR Code ini melalui WhatsApp &gt; Perangkat Tertaut
                </p>
                <QRCode value={qr} />
                <p className="mt-3 text-center text-xs text-stone-400">
                  QR Code akan kadaluarsa dalam beberapa menit. Scan segera sebelum masa berlaku habis.
                </p>
              </>
            )}
            {resetButton}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-stone-800">Tentang WhatsApp Session</h3>
        <ul className="space-y-2 text-xs text-stone-500">
          <li className="flex gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            Hubungkan WhatsApp Anda agar bot dapat membalas pesan pelanggan secara otomatis.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            Scan QR Code dari menu <span className="font-medium text-stone-600">WhatsApp &gt; Perangkat Tertaut</span> di ponsel Anda.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            Session akan tetap aktif hingga Anda putuskan. Setelah diputuskan, scan QR baru untuk menghubungkan ulang.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            Klik <span className="font-medium text-stone-600">Putuskan</span> untuk memutuskan session kapan saja.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            Jika session bermasalah, klik <span className="font-medium text-stone-600">Reset Koneksi</span> untuk menghapus data session lama dan memulai pairing ulang.
          </li>
        </ul>
      </Card>
    </div>
  )
}

function SessionInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/60 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">{label}</p>
      <p className="text-sm font-medium text-stone-800">{value}</p>
    </div>
  )
}
