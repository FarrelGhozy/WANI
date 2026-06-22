import { useWaStatus } from '../hooks/useWaStatus.ts'
import QRCode from '../components/QRCode.tsx'
import StatusCard from '../components/StatusCard.tsx'

function mapConnection(status: string): 'success' | 'warning' | 'error' {
  switch (status) {
    case 'connected':
      return 'success'
    case 'connecting':
      return 'warning'
    default:
      return 'error'
  }
}

export default function Dashboard() {
  const { qr, connection, phone, loading, error } = useWaStatus()

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatusCard
          label="Connection"
          value={connection}
          status={mapConnection(connection)}
        />
        <StatusCard
          label="Phone Number"
          value={phone}
          status={phone ? 'success' : 'neutral'}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-sm font-medium text-gray-600">QR Code</h2>
        <QRCode value={qr} />
      </div>
    </div>
  )
}
