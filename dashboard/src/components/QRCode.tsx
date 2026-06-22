import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  value: string | null
  size?: number
}

export default function QRCode({ value, size = 200 }: QRCodeProps) {
  if (!value || value === 'mock-qr-data-for-development') {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50" style={{ width: size, height: size }}>
        <div className="text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-stone-300">
            <rect x="2" y="2" width="8" height="8" rx="1" />
            <rect x="14" y="2" width="8" height="8" rx="1" />
            <rect x="2" y="14" width="8" height="8" rx="1" />
            <rect x="14" y="14" width="4" height="4" rx="1" />
            <rect x="20" y="14" width="2" height="4" rx="0.5" />
            <rect x="14" y="20" width="4" height="2" rx="0.5" />
          </svg>
          <p className="mt-2 text-xs text-stone-400">Waiting for QR</p>
        </div>
      </div>
    )
  }

  return (
    <div className="inline-block rounded-xl bg-white p-3 ring-1 ring-stone-200">
      <QRCodeSVG value={value} size={size} level="M" />
    </div>
  )
}
