import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  value: string | null
}

export default function QRCode({ value }: QRCodeProps) {
  if (!value) {
    return (
      <div className="flex aspect-square w-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
        <p className="text-sm text-gray-400">No QR code available</p>
      </div>
    )
  }

  return (
    <div className="inline-block rounded-lg border bg-white p-4 shadow-sm">
      <QRCodeSVG value={value} size={256} level="M" />
    </div>
  )
}
