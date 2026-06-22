import type { WaSession } from '../hooks/useSettings.ts'
import Card from './ui/Card.tsx'
import Button from './ui/Button.tsx'
import QRCode from './QRCode.tsx'

interface WaSessionTabProps {
  session: WaSession
  onDisconnect: () => void
}

const statusDot: Record<string, string> = {
  connected: 'bg-emerald-500',
  disconnected: 'bg-stone-400',
  connecting: 'bg-amber-500',
}

const statusLabel: Record<string, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
}

export default function WaSessionTab({ session, onDisconnect }: WaSessionTabProps) {
  return (
    <Card accent="teal">
      <h2 className="mb-6 text-lg font-semibold text-stone-900">WhatsApp Session</h2>

      {/* Status */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-stone-50 p-4">
          <p className="text-xs text-stone-500">Status</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${statusDot[session.status]}`} />
            <span className="text-sm font-medium text-stone-900">{statusLabel[session.status]}</span>
          </div>
        </div>
        <div className="rounded-lg bg-stone-50 p-4">
          <p className="text-xs text-stone-500">Phone Number</p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {session.phone ?? '-'}
          </p>
        </div>
        <div className="rounded-lg bg-stone-50 p-4">
          <p className="text-xs text-stone-500">Action</p>
          <div className="mt-1">
            {session.status === 'connected' ? (
              <Button size="sm" variant="danger" onClick={onDisconnect}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" variant="primary" disabled={session.status === 'connecting'}>
                {session.status === 'connecting' ? 'Connecting...' : 'Reconnect'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* QR */}
      {session.qr && (
        <div className="flex flex-col items-center rounded-lg bg-stone-50 p-6">
          <p className="mb-3 text-xs font-medium text-stone-500">
            Scan this QR Code with WhatsApp &gt; Linked Devices
          </p>
          <QRCode value={session.qr} />
        </div>
      )}

      {session.status === 'connected' && (
        <div className="flex flex-col items-center rounded-lg bg-emerald-50 p-6">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-600">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-emerald-800">WhatsApp Connected</p>
          <p className="text-xs text-emerald-600">{session.phone}</p>
        </div>
      )}
    </Card>
  )
}
